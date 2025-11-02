package aiService

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"gin-notebook/internal/http/message"
	appi18n "gin-notebook/internal/i18n"
	lctx "gin-notebook/internal/locale"
	"gin-notebook/internal/model"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/dto"
	httpClient "gin-notebook/internal/pkg/http"
	"gin-notebook/internal/repository"
	"gin-notebook/internal/thirdparty/aiServer"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/algorithm"
	"gin-notebook/pkg/utils/constant"
	"gin-notebook/pkg/utils/tools"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/nicksnyder/go-i18n/v2/i18n"
)

func GetAIChatResponse(ctx context.Context, params *dto.AIRequestDTO) (*http.Response, error) {
	// 1) 从中间件注入的上下文取出 locale/localizer
	locale := lctx.FromLocale(ctx)
	loc := lctx.FromLocalizer(ctx, appi18n.NewLocalizer(locale))

	// 便捷函数：多语言渲染
	t := func(id string, data map[string]any) string {
		config := &i18n.LocalizeConfig{MessageID: id}
		if data != nil {
			config.TemplateData = data
		}
		return loc.MustLocalize(config)
	}

	aiSettings, err := repository.GetAISettings()
	if err != nil {
		return nil, err
	}

	// 2) 找到最后一条用户消息
	var latest_message dto.AIMessageDTO
	for i := len(params.Messages) - 1; i >= 0; i-- {
		if params.Messages[i].Role == "user" && strings.TrimSpace(params.Messages[i].Content) != "" {
			latest_message = params.Messages[i]
			break
		}
	}

	if strings.TrimSpace(latest_message.Content) == "" {
		return nil, fmt.Errorf("no user message to process") // 或返回一个 i18n 友好提示
	}

	// 3) 意图识别
	resp, err := aiServer.GetInstance().GetIntent(ctx, latest_message.Content)
	if err != nil {
		logger.LogError(err, "意图识别错误：")
		return nil, err
	}
	intent := resp.Intent
	logger.LogInfo("识别到的意图：", intent)
	// 4) 拉取 Prompt 模板（结构化场景保持“仅 JSON 输出”）
	promptModel, err := repository.GetAIPromptByIntent(intent)

	finalSystemPrompt := ""
	if err == nil {
		finalSystemPrompt = strings.TrimSpace(promptModel.Template)
	}

	if finalSystemPrompt == "" {
		if intent == "create_todo" {
			finalSystemPrompt = `
你是“待办任务槽位抽取器”。严格输出**仅 JSON**，不要任何解释或 markdown。
返回：
{
  "status": "OK" | "IGNORE",
  "slots": {
    "title": string,             // 未提到则 "Untitled Task"
    "priority": 0|1|2|3,         // 未提到=0
    "process_id": 0|1|2,         // 未提到=0
    "project_name": string|null, // 未提到=null
    "column_id": number|null,    // 未提到=null
    "deadline": "YYYY-MM-DD"|null
  }
}
仅输出一个 JSON 对象。`
		} else {
			finalSystemPrompt = "你是一个有用且简洁的助手，请用清晰直截了当的方式回答。"
		}
	}

	spec := constant.ModelTotalContext(aiSettings.Model)

	// 动态计算输入预算，避免上下文过长
	inputBudget := spec.RecommendedInput
	if aiSettings.AIInputMaxTokens > 0 {
		inputBudget = int(aiSettings.AIInputMaxTokens)
	}

	// 动态输出上限
	outputBudget := spec.RecommendedOutput
	if aiSettings.AIOutputMaxTokens > 0 {
		outputBudget = int(aiSettings.AIOutputMaxTokens)
	}

	// 防止总和超过模型上限（加安全余量）
	safety := 512
	if inputBudget+outputBudget+safety > spec.TotalContextTokens {
		inputBudget = spec.TotalContextTokens - outputBudget - safety
	}

	if inputBudget < 256 {
		inputBudget = 256
	}
	if outputBudget < 16 {
		outputBudget = 16
	}

	maxOutput := spec.TotalContextTokens - inputBudget - safety
	if maxOutput < 16 {
		maxOutput = 16
	}
	if outputBudget > maxOutput {
		outputBudget = maxOutput
	}
	latest_message.Content = strings.TrimSpace(latest_message.Content)
	sysTok := len([]rune(finalSystemPrompt))
	latTok := len([]rune(latest_message.Content))
	if sysTok+latTok > inputBudget {
		keep := inputBudget - sysTok - 16 // 留点缓冲
		if keep < 0 {
			keep = 0
		}
		runes := []rune(latest_message.Content)
		if keep < len(runes) {
			if keep == 0 {
				latest_message.Content = "" // 实在装不下就只发 system
			} else {
				latest_message.Content = string(runes[:keep])
			}
			latTok = len([]rune(latest_message.Content))
		}
	}

	var usedTokens int = sysTok + latTok

	msgs := []dto.AIMessageDTO{}

	if params.SessionID != nil && params.MemberID != 0 {
		messages, err := repository.GetAIMessageBySessionID(*params.SessionID, params.MemberID)
		logger.LogInfo("messages:", messages[len(messages)-1])
		if err == nil {
			logger.LogInfo("历史信息长度：", len(messages), "输入token最大值", inputBudget)

			for i := len(messages) - 1; i >= 0; i-- {
				// 跳过错误的助手消息，避免上下文污染
				if messages[i].Role == "assistant" && messages[i].Status == "error" {
					i--
					continue
				}

				if usedTokens+len([]rune(messages[i].Content)) >= inputBudget {
					logger.LogInfo("超出范围：", usedTokens+len([]rune(messages[i].Content)))
					break
				}
				usedTokens += len([]rune(messages[i].Content))
				msgs = append(msgs, dto.AIMessageDTO{Role: messages[i].Role, Content: messages[i].Content})
			}
		}
	}
	tools.Reverse(msgs)

	msgs = append([]dto.AIMessageDTO{{Role: "system", Content: finalSystemPrompt}}, msgs...)
	logger.LogInfo("当前token使用量", usedTokens)
	if intent == "create_todo" {
		payload := dto.AIHttpRequestDTO{
			Messages:  msgs,
			Stream:    false,
			Model:     aiSettings.Model,
			MaxTokens: outputBudget,
		}
		body, _ := json.Marshal(payload)
		upReq, _ := http.NewRequestWithContext(ctx, "POST", aiSettings.ApiUrl, bytes.NewReader(body))
		upReq.Header.Set("Authorization", "Bearer "+aiSettings.ApiKey)
		upReq.Header.Set("Content-Type", "application/json")

		client := httpClient.GetClient()
		upRes, err := client.Do(upReq)
		if err != nil {
			logger.LogError(err, "获取API结果错误：")
			return nil, err
		}
		defer upRes.Body.Close()

		// 读取并解析上游响应
		if upRes.StatusCode < 200 || upRes.StatusCode >= 300 {
			b, _ := io.ReadAll(upRes.Body)
			logger.LogError(fmt.Errorf("upstream %d: %s", upRes.StatusCode, string(b)), "AI 服务非 2xx")
			return StreamFakeOpenAI(ctx, aiSettings.Model, []string{t("todo.create.fail_upstream", nil) + "\n"}, tools.Ptr(http.StatusInternalServerError))
		}

		bodyBytes, err := io.ReadAll(upRes.Body)
		if err != nil {
			logger.LogError(err, "读取 AI 响应失败")
			return StreamFakeOpenAI(ctx, aiSettings.Model, []string{
				"出现错误，无法读取 AI 响应。\n",
			}, tools.Ptr(http.StatusInternalServerError))
		}
		var chunk oaChunk
		if err := json.Unmarshal(bodyBytes, &chunk); err != nil {
			logger.LogError(err, "解析 AI 响应失败")
			return StreamFakeOpenAI(ctx, aiSettings.Model, []string{
				t("todo.create.fail_parse", nil) + "\n",
			}, tools.Ptr(http.StatusInternalServerError))
		}

		if len(chunk.Choices) == 0 || chunk.Choices[0].Message.Content == "" {
			logger.LogError(fmt.Errorf("empty choices"), "AI 响应 choices 为空")
			return StreamFakeOpenAI(ctx, aiSettings.Model, []string{t("todo.create.fail_parse", nil) + "\n"}, tools.Ptr(http.StatusInternalServerError))
		}

		respContent := chunk.Choices[0].Message.Content
		var todo dto.AICreateTodoDTO
		if err := json.Unmarshal([]byte(respContent), &todo); err != nil {
			logger.LogError(err, "解析待办任务 JSON 失败")
			return StreamFakeOpenAI(ctx, aiSettings.Model, []string{
				t("todo.create.fail_parse", nil) + "\n",
			}, tools.Ptr(http.StatusInternalServerError))
		}

		// 入库
		slot := todo.Slots
		title := "Untitled Task"
		if slot.Title != nil && strings.TrimSpace(*slot.Title) != "" {
			title = strings.TrimSpace(*slot.Title)
		}

		task := model.ToDoTask{
			Title:   title,
			Creator: params.MemberID,
		}

		if slot.Deadline != nil {
			if date, err := time.Parse("2006-01-02", *slot.Deadline); err == nil {
				task.Deadline = &date
			}
		}
		if slot.Priority != nil {
			task.Priority = uint8(*slot.Priority)
		}

		var projectName string
		if slot.ProjectName != nil {
			projectName = *slot.ProjectName
		}
		columns, _ := repository.GetProjectColumnsByProjectName(database.DB, projectName, params.WorkspaceID, nil)
		if slot.ProcessID == nil {
			slot.ProcessID = tools.Ptr(0)
		}

		found := false

		for _, col := range columns {
			if col.ProcessID == uint8(*slot.ProcessID) {
				task.ColumnID = col.ID
				task.ProjectID = col.ProjectID

				order, _ := repository.GetFirstOrderIndexInColumn(ctx, database.DB, task.ColumnID)
				if order != "" {
					task.OrderIndex = algorithm.RankBetween(algorithm.RankMin().String(), order)
				} else {
					task.OrderIndex = algorithm.RankBetween(algorithm.RankMax().String(), algorithm.RankMin().String())

				}
				found = true
				break
			}
		}

		if !found {
			// 使用默认项目和默认列
			return StreamFakeOpenAI(ctx, aiSettings.Model, []string{t("todo.create.fail_no_column", nil) + "\n"}, tools.Ptr(http.StatusInternalServerError))
		}

		if err := repository.CreateProjectTask(database.DB, &task); err != nil {
			logger.LogError(err, "创建待办任务失败")
			return StreamFakeOpenAI(ctx, aiSettings.Model, []string{
				t("todo.create.fail_internal", nil) + "\n",
			}, tools.Ptr(http.StatusInternalServerError))
		}

		// —— 多语言回显 —— //
		var lines []string
		lines = append(lines, t("todo.created.title", nil)+"\n")
		lines = append(lines, fmt.Sprintf("%s：%s\n", t("todo.field.title", nil), task.Title))
		if slot.Priority != nil {
			lines = append(lines, fmt.Sprintf(
				"%s：%s\n",
				t("todo.field.priority", nil),
				t(fmt.Sprintf("priority.%d", *slot.Priority), nil),
			))
		}
		if slot.Deadline != nil {
			lines = append(lines, fmt.Sprintf("%s：%s\n", t("todo.field.deadline", nil), *slot.Deadline))
		}
		if projectName != "" {
			lines = append(lines, fmt.Sprintf("%s：%s\n", t("todo.field.project", nil), projectName))
		}
		lines = append(lines, t("todo.success.suffix", nil)+"\n")

		return StreamFakeOpenAI(ctx, aiSettings.Model, lines, nil)
	} else {
		if params.IsSearchInternet {
			aiSettings.Model = aiSettings.Model + "?search"
		}
		payload := dto.AIHttpRequestDTO{
			Messages:  msgs,
			Stream:    true,
			Model:     aiSettings.Model,
			MaxTokens: outputBudget,
		}

		if params.ToolChoice != nil {
			payload.ToolChoice = params.ToolChoice
		}
		if params.Tools != nil {
			payload.Tools = params.Tools
		}

		body, _ := json.Marshal(payload)
		upReq, _ := http.NewRequestWithContext(ctx, "POST", aiSettings.ApiUrl, bytes.NewReader(body))
		upReq.Header.Set("Authorization", "Bearer "+aiSettings.ApiKey)
		upReq.Header.Set("Content-Type", "application/json")

		client := httpClient.GetStreamClient()
		upRes, err := client.Do(upReq)
		if err != nil {
			return nil, err
		}
		return upRes, nil
	}

}

func GetAIHistoryChat(params *dto.AIHistoryChatParamsDTO) (responseCode int, data *dto.AIHistoryChatResponseDTO) {
	session, err := repository.GetAISessionsByID(*params)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	count, err := repository.GetAISessionCount(params.MemberID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	data = &dto.AIHistoryChatResponseDTO{
		Total:    count,
		Sessions: session,
	}
	return
}

func DeleteAIHostoryChat(params *dto.AIHistoryDeleteParamsDTO) (responseCode int) {
	if err := repository.DeleteAISessionByID(params.SessionID, params.MemberID); err != nil {
		responseCode = database.IsError(err)
		return
	}
	responseCode = message.SUCCESS
	return
}

func UpdateAISessionChat(params *dto.AIHistoryUpdateParamsDTO) (responseCode int) {
	data := map[string]interface{}{}

	if params.Title != nil {
		data["title"] = *params.Title
	}

	if err := repository.UpdateAISession(database.DB, params.SessionID, params.MemberID, data); err != nil {
		responseCode = database.IsError(err)
		return
	}
	responseCode = message.SUCCESS
	return
}

func GetAISession(params *dto.AISessionParamsDTO) (responseCode int, data *dto.AISessionResponseDTO) {
	session, err := repository.GetAISessionByID(params.SessionID, params.MemberID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	messages, err := repository.GetAIMessageBySessionID(params.SessionID, params.MemberID)
	if err != nil {
		responseCode = database.IsError(err)
		return
	}

	data = &dto.AISessionResponseDTO{
		Title:    session.Title,
		Messages: messages,
	}
	return message.SUCCESS, data
}
