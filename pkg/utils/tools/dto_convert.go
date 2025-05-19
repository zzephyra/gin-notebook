package tools

import (
	"fmt"
	"reflect"
	"strconv"
	"strings"
)

func StructToUpdateMap(input interface{}, override map[string]string, ignoreFields []string) map[string]interface{} {
	result := make(map[string]interface{})
	ignoreSet := make(map[string]struct{}, len(ignoreFields))
	for _, f := range ignoreFields {
		ignoreSet[f] = struct{}{}
	}

	var extractFields func(reflect.Value, reflect.Type)

	extractFields = func(val reflect.Value, typ reflect.Type) {
		if val.Kind() == reflect.Ptr {
			val = val.Elem()
		}

		for i := 0; i < val.NumField(); i++ {
			field := typ.Field(i)
			fieldVal := val.Field(i)
			// 忽略非导出字段
			if !fieldVal.CanInterface() {
				continue
			}

			// 处理匿名嵌套结构体（继承）
			if field.Anonymous && fieldVal.Kind() == reflect.Struct {
				fmt.Println("理匿名嵌套结构体（继承）", field.Name)
				extractFields(fieldVal, fieldVal.Type())
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

			// 字段名覆盖
			if altKey, ok := override[field.Name]; ok {
				jsonKey = altKey
			}

			// 只取非 nil 的指针字段
			if fieldVal.Kind() == reflect.Ptr {
				if !fieldVal.IsNil() {
					result[jsonKey] = fieldVal.Elem().Interface()
				}
			} else {
				result[jsonKey] = fieldVal.Interface()
			}
		}
	}

	val := reflect.ValueOf(input)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}
	extractFields(val, val.Type())
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

// ConvertCacheToModel 把 Redis/缓存中的 map[string]string 转成结构体。
// modelInstance 必须是 *T 形式的指针，否则返回错误。
func ConvertCacheToModel(data map[string]string, modelInstance interface{}) error {
	// 1. 基本检查
	valPtr := reflect.ValueOf(modelInstance)
	if valPtr.Kind() != reflect.Ptr || valPtr.IsNil() {
		return fmt.Errorf("modelInstance 必须是非 nil 的指针")
	}

	structVal := valPtr.Elem()
	structTyp := structVal.Type()

	// 2. 遍历字段
	for i := 0; i < structTyp.NumField(); i++ {
		field := structTyp.Field(i)
		fieldVal := structVal.Field(i)

		// 2.1 取 json tag；形如 "storage_driver,omitempty"
		tag := field.Tag.Get("json")
		tagName := strings.Split(tag, ",")[0] // 取逗号前部分
		if tagName == "" || tagName == "-" {
			tagName = field.Name
		}

		raw, ok := data[tagName]
		if !ok {
			continue // 缓存里没有该字段，跳过
		}
		if !fieldVal.CanSet() {
			continue // 无法设置（非导出等），跳过
		}

		// 2.2 支持指针和基础类型
		target := fieldVal
		needAddr := false
		if fieldVal.Kind() == reflect.Ptr {
			needAddr = true
			// 创建一个新的 Elem 用来存放值
			target = reflect.New(fieldVal.Type().Elem()).Elem()
		}

		switch target.Kind() {
		case reflect.String:
			target.SetString(raw)

		case reflect.Bool:
			parsed, err := strconv.ParseBool(raw)
			if err != nil {
				return fmt.Errorf("字段 %s 解析 bool 失败: %w", field.Name, err)
			}
			target.SetBool(parsed)

		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			parsed, err := strconv.ParseInt(raw, 10, target.Type().Bits())
			if err != nil {
				return fmt.Errorf("字段 %s 解析 int 失败: %w", field.Name, err)
			}
			target.SetInt(parsed)

		case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
			parsed, err := strconv.ParseUint(raw, 10, target.Type().Bits())
			if err != nil {
				return fmt.Errorf("字段 %s 解析 uint 失败: %w", field.Name, err)
			}
			target.SetUint(parsed)

		default:
			return fmt.Errorf("暂不支持字段 %s 的类型: %s", field.Name, target.Kind())
		}

		// 2.3 如果原字段是指针，把初始化好的地址设回去
		if needAddr {
			fieldVal.Set(target.Addr())
		} else {
			fieldVal.Set(target)
		}
	}

	return nil
}
