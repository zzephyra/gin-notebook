// internal/aiServer/stream_openai_fake.go
package aiService

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type oaChunk struct {
	ID      string     `json:"id"`
	Object  string     `json:"object"`
	Created int64      `json:"created"`
	Model   string     `json:"model"`
	Choices []oaChoice `json:"choices"`
}
type oaChoice struct {
	Index        int        `json:"index"`
	Delta        oaDelta    `json:"delta"`
	Message      *oaMessage `json:"message,omitempty"`
	FinishReason *string    `json:"finish_reason,omitempty"`
}
type oaDelta struct {
	Role    string  `json:"role,omitempty"`
	Content *string `json:"content,omitempty"`
}

type oaMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func StreamFakeOpenAI(ctx context.Context, model string, lines []string, statusCode *int) (*http.Response, error) {
	code := http.StatusOK
	if statusCode != nil {
		code = *statusCode
	}
	pr, pw := io.Pipe()

	h := make(http.Header)
	h.Set("Content-Type", "text/event-stream")
	h.Set("Cache-Control", "no-cache")
	h.Set("Connection", "keep-alive")
	h.Set("Transfer-Encoding", "chunked")
	// 对 Nginx 等反代强制关闭缓冲：
	h.Set("X-Accel-Buffering", "no")

	write := func(jsonLine string) {
		fmt.Fprintf(pw, "data: %s\n\n", jsonLine)
	}
	writeDelta := func(delta any) {
		b, _ := json.Marshal(map[string]any{
			"id":      fmt.Sprintf("chatcmpl-%d", time.Now().UnixNano()),
			"object":  "chat.completion.chunk",
			"created": time.Now().Unix(),
			"model":   model,
			"choices": []map[string]any{{"index": 0, "delta": delta}},
		})
		write(string(b))
	}

	go func() {
		defer pw.Close()

		// 1) 角色首帧
		writeDelta(map[string]any{"role": "assistant"})

		// 2) 模拟打字：逐“小片”写入 + Sleep
		for _, ln := range lines {
			// 按 3 个字符一组
			runes := []rune(ln + "\n")
			for i := 0; i < len(runes); i += 3 {
				end := i + 3
				if end > len(runes) {
					end = len(runes)
				}
				frag := string(runes[i:end])
				writeDelta(map[string]any{"content": frag})

				// 小间隔（调节手感：20~60ms）
				select {
				case <-time.After(40 * time.Millisecond):
				case <-ctx.Done():
					return
				}
			}
		}

		// 3) 结束帧 + [DONE]
		end, _ := json.Marshal(map[string]any{
			"id":      fmt.Sprintf("chatcmpl-%d", time.Now().UnixNano()),
			"object":  "chat.completion.chunk",
			"created": time.Now().Unix(),
			"model":   model,
			"choices": []map[string]any{{"index": 0, "finish_reason": "stop"}},
		})
		write(string(end))
		write("[DONE]")
	}()

	return &http.Response{StatusCode: code, Header: h, Body: pr}, nil
}
