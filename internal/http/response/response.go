package response

import "gin-notebook/internal/http/message"

func Call(data interface{}, msg string) map[string]interface{} {
	return map[string]interface{}{
		"code":    message.SUCCESS,
		"message": msg,
		"data":    data,
	}
}
