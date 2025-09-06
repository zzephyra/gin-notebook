package tools

import (
	"crypto/rand"
	"encoding/base64"
)

// 生成和 Nginx 类似的 base64 request_id
func GenerateBase64RequestID() string {
	b := make([]byte, 16) // Nginx 默认 16 字节
	_, _ = rand.Read(b)
	return base64.RawURLEncoding.EncodeToString(b) // URL-safe, 无填充
}
