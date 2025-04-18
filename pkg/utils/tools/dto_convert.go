package tools

import (
	"reflect"
	"strings"
)

func StructToUpdateMap(input interface{}, override map[string]string, ignoreFields []string) map[string]interface{} {
	result := make(map[string]interface{})

	val := reflect.ValueOf(input)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}

	ignoreSet := make(map[string]struct{}, len(ignoreFields))
	for _, f := range ignoreFields {
		ignoreSet[f] = struct{}{}
	}

	typ := val.Type()

	for i := 0; i < val.NumField(); i++ {
		field := typ.Field(i)
		fieldVal := val.Field(i)

		// 忽略非导出字段
		if !fieldVal.CanInterface() {
			continue
		}

		// 忽略指定字段
		if _, ok := ignoreSet[field.Name]; ok {
			continue
		}

		// 获取 json tag 或字段名
		jsonKey := field.Tag.Get("json")
		if commaIdx := strings.Index(jsonKey, ","); commaIdx != -1 {
			jsonKey = jsonKey[:commaIdx]
		}
		if jsonKey == "" {
			jsonKey = strings.ToLower(field.Name)
		}

		// 支持字段名覆盖
		if altKey, ok := override[field.Name]; ok {
			jsonKey = altKey
		}

		// 只取非 nil 的 *T 字段
		if fieldVal.Kind() == reflect.Ptr && !fieldVal.IsNil() {
			result[jsonKey] = fieldVal.Elem().Interface()
		}
	}

	return result
}
