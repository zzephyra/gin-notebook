package tools

import (
	"fmt"
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

// CopyFields 将 from 结构体中的字段值复制到 to 结构体中
// 会跳过 ignoredFields 中指定的字段名（区分大小写）
func CopyFields(from, to interface{}, ignoredFields []string) {
	fromVal := reflect.ValueOf(from)
	toVal := reflect.ValueOf(to)

	// 支持传入指针
	if fromVal.Kind() == reflect.Ptr {
		fromVal = fromVal.Elem()
	}
	if toVal.Kind() == reflect.Ptr {
		toVal = toVal.Elem()
	}

	if !fromVal.IsValid() || !toVal.IsValid() {
		return
	}

	fromType := fromVal.Type()
	ignoredMap := make(map[string]struct{}, len(ignoredFields))
	for _, f := range ignoredFields {
		ignoredMap[f] = struct{}{}
	}

	for i := 0; i < fromVal.NumField(); i++ {
		field := fromType.Field(i)
		name := field.Name

		if _, ignored := ignoredMap[name]; ignored {
			continue
		}

		fromField := fromVal.Field(i)
		toField := toVal.FieldByName(name)

		// 字段存在且可设置
		if toField.IsValid() && toField.CanSet() {
			// 如果源字段是指针且不为 nil，则解引用赋值
			if fromField.Kind() == reflect.Ptr && !fromField.IsNil() {
				// 目标是非指针字段，直接赋值
				if toField.Kind() != reflect.Ptr {
					toField.Set(fromField.Elem())
				} else {
					toField.Set(fromField)
				}
			} else if fromField.Kind() != reflect.Ptr {
				toField.Set(fromField)
			}
		} else {
			fmt.Println(name)
		}
	}
}

func Contains(list []string, v string) bool {
	for _, s := range list {
		if s == v {
			return true
		}
	}
	return false
}
