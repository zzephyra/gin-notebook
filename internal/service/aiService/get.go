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
	"gin-notebook/internal/pkg/cache"
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

	"math/rand/v2"

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
	promptModel, err := repository.GetAIPromptByIntent(ctx, database.DB, intent)

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

func GetAIChatActions(ctx context.Context) (responseCode int, data map[string]interface{}) {
	var actions = []model.AIActionExposure{}
	var ttl = 24 * time.Hour
	jitter := time.Duration(rand.Int64N(int64(ttl / 10)))
	if data == nil {
		data = map[string]interface{}{}
	}

	hit, err := cache.RedisInstance.GetAndUnmarshal(ctx, cache.PromptListKey, &actions)

	if err != nil {
		logger.LogError(err, "读取 AI Prompt 缓存失败，将尝试回源")
	}

	if hit {
		actionsData := []map[string]interface{}{}

		for _, action := range actions {
			actionsData = append(actionsData, action.Serialization())
		}
		responseCode = message.SUCCESS
		data["actions"] = actionsData
		return
	}

	if !hit {
		// 获取分布式锁
		unlock, lockErr := cache.RedisInstance.Lock(ctx, cache.PromptListKey+":lock", 1*time.Minute)
		if lockErr != nil {
			time.Sleep(30 * time.Millisecond)
		}

		hit2, err2 := cache.RedisInstance.GetAndUnmarshal(ctx, cache.PromptListKey, &actions)

		if hit2 && err2 == nil {
			actionsData := []map[string]interface{}{}

			for _, action := range actions {
				actionsData = append(actionsData, action.Serialization())
			}
			responseCode = message.SUCCESS
			data["actions"] = actionsData
			return
		}

		if lockErr != nil {
			// 两次缓存未击中
			responseCode = message.SUCCESS
			data["actions"] = []map[string]interface{}{}
			return
		}

		defer func() {
			if unlock != nil {
				unlock()
			}
		}()

		actions, err = repository.GetAllActionActions(ctx, database.DB)

		if err != nil {
			logger.LogError(err, "获取 AI Prompt 列表失败")
			responseCode = message.ERROR_INTERNAL_SERVER
			return
		}

		cacheErr := cache.RedisInstance.MarshalAndSet(ctx, cache.PromptListKey, actions, ttl+jitter)

		if cacheErr != nil {
			logger.LogError(err, "缓存action出错")
		}
	}

	actionsData := []map[string]interface{}{}

	for _, action := range actions {
		actionsData = append(actionsData, action.Serialization())
	}

	data["actions"] = actionsData

	responseCode = message.SUCCESS
	return
}

func GetOrRecachePrompts(ctx context.Context, intents []string) []map[string]string {
	if len(intents) == 0 {
		return nil
	}

	now := time.Now()
	ttl := 10 * time.Minute
	out := make([]map[string]string, 0, len(intents))

	for _, intent := range intents {
		key := cache.PromptPrefix + intent

		// 1) 先读缓存（不加锁）
		prompt, err := cache.RedisInstance.GetPromptByIntent(ctx, intent)
		if err == nil && len(prompt) > 0 {
			// 检查逻辑过期
			if expStr, ok := prompt["expired_at"]; ok && expStr != "" {
				if exp, e := time.Parse(time.RFC3339, expStr); e == nil && now.Before(exp) {
					out = append(out, prompt) // 命中直接返回
					continue
				}
			}
		}

		// 2) miss/过期 → 尝试单飞锁
		lockKey := key + ":lock"
		unlock, lerr := cache.RedisInstance.Lock(ctx, lockKey, 30*time.Second)
		if lerr != nil || unlock == nil {
			// 没拿到锁：说明有人在回源。稍等再读一次（双检），拿到就用；拿不到就跳过/降级
			time.Sleep(80 * time.Millisecond)
			p2, _ := cache.RedisInstance.GetPromptByIntent(ctx, intent)
			if len(p2) > 0 {
				if expStr, ok := p2["expired_at"]; ok && expStr != "" {
					if exp, e := time.Parse(time.RFC3339, expStr); e == nil && now.Before(exp) {
						out = append(out, p2) // 只在仍然“未过期”时返回
						continue
					}
				}
			}
			continue
		}

		// 3) 拿到锁后双检
		func() {
			defer unlock()

			p3, _ := cache.RedisInstance.GetPromptByIntent(ctx, intent)
			if len(p3) > 0 {
				// 仍需检查是否已被他人刷新
				if expStr, ok := p3["expired_at"]; ok && expStr != "" {
					if exp, e := time.Parse(time.RFC3339, expStr); e == nil && now.Before(exp) {
						out = append(out, p3)
						return
					}
				}
			}

			// 4) 真正回源 DB（单个 intent）
			rows, dbErr := repository.GetAIPromptByIntents(ctx, database.DB, []string{intent})
			if dbErr != nil || len(rows) == 0 {
				// 回源失败：不影响其它 intent，记录日志即可
				if dbErr != nil {
					logger.LogWarn(dbErr, "GetAIPromptByIntents failed", "intent", intent)
				} else {
					logger.LogWarn("prompt not found in DB", "intent", intent)
				}
				return
			}
			pm := rows[0]

			// 5) 回填缓存（带逻辑过期）
			cacheMap := tools.StructToUpdateMap(pm, nil, []string{"DeletedAt"})
			cacheMap["expired_at"] = now.Add(ttl).Format(time.RFC3339)
			cacheMap["prompt_type"] = string(pm.PromptType)
			if err := cache.RedisInstance.Client.HSet(ctx, key, cacheMap).Err(); err != nil {
				logger.LogWarn(err, "HMSet prompt cache failed", "intent", intent)
			}

			// 6) 组织返回
			item := map[string]string{
				"id":         fmt.Sprintf("%d", pm.ID),
				"intent":     pm.Intent,
				"template":   pm.Template,
				"is_active":  fmt.Sprintf("%t", pm.IsActive),
				"updated_at": pm.UpdatedAt.Format(time.RFC3339),
				"expired_at": cacheMap["expired_at"].(string),
			}
			if pm.Description != nil {
				item["description"] = *pm.Description
			}
			out = append(out, item)
		}()
	}

	return out
}

func GetAIChatPrompts(ctx context.Context) (responseCode int, data map[string]interface{}) {
	// 先获取缓存的intents数据
	intents, err := cache.RedisInstance.GetAllIntents(ctx)
	if err != nil || len(intents) == 0 {
		// 如果报错，意味着没有对应的缓存，则进行数据回填
		// 先加分布式锁保证并发请求
		unlock, err := cache.RedisInstance.Lock(ctx, cache.IntentListKey+":lock", 1*time.Minute)
		defer func() {
			if unlock != nil {
				unlock()
			}
		}()
		if err != nil {
			// 阻塞并发请求，延迟请求
			time.Sleep(300 * time.Millisecond)
			intents, secondErr := cache.RedisInstance.GetAllIntents(ctx)
			if secondErr != nil {
				logger.LogError(secondErr, "获取 AI Prompt 意图列表失败")
				responseCode = message.SUCCESS
				data = map[string]interface{}{
					"prompts": []map[string]string{},
				}
				return
			} else {
				prompts := GetOrRecachePrompts(ctx, intents)
				data = map[string]interface{}{
					"prompts": prompts,
				}
				responseCode = message.SUCCESS
				return
			}
		}

		intents, err = repository.GetAllIntents(ctx, database.DB)

		if err != nil {
			logger.LogError(err, "获取 AI Prompt 意图列表失败")
			responseCode = message.SUCCESS
			data = map[string]interface{}{
				"prompts": []map[string]string{},
			}
			return
		}

		var cacheData = make([]interface{}, len(intents))
		for i, v := range intents {
			cacheData[i] = v
		}
		// 回填缓存
		if len(cacheData) > 0 {
			cacheErr := cache.RedisInstance.Client.SAdd(ctx, cache.IntentListKey, cacheData...).Err()
			if cacheErr != nil {
				responseCode = message.ERROR_AI_INTENTS_CACHE_FAIL
				data = map[string]interface{}{
					"prompts": []map[string]string{},
				}
				return
			}
		}
	}
	prompts := GetOrRecachePrompts(ctx, intents)

	if prompts == nil {
		prompts = []map[string]string{}
	}

	data = map[string]interface{}{
		"prompts": prompts,
	}
	responseCode = message.SUCCESS
	return
}
