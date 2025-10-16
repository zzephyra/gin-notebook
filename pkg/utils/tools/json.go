package tools

import (
	"encoding/json"
	"gin-notebook/pkg/logger"
)

func MustJSONBytes(v any) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		logger.LogError(err, "marshal failed")
		return []byte("[]")
	}
	return b
}
