package response

import "gin-notebook/internal/http/message"

func Response(code int, data any) map[string]interface{} {
	response := map[string]interface{}{"code": code}

	if code == message.SUCCESS {
		response["message"] = message.CodeMsg[code]
	} else {
		response["error"] = message.CodeMsg[code]
	}

	if data != nil {
		response["data"] = data
	}

	return response
}
