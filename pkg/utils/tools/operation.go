package tools

import (
	"encoding/json"
	"math"
	"reflect"
	"strconv"

	"github.com/gin-gonic/gin"
)

func Find(slice []string, val string) (int, bool) {
	for i, item := range slice {
		if item == val {
			return i, true
		}
	}
	return -1, false
}

func ToInt64(x any) (int64, bool) {
	switch v := x.(type) {
	case int64:
		return v, true
	case *int64:
		if v != nil {
			return *v, true
		}
		return 0, false
	case int:
		return int64(v), true
	case int32:
		return int64(v), true
	case uint:
		if uint64(v) <= math.MaxInt64 {
			return int64(v), true
		}
		return 0, false
	case uint64:
		if v <= math.MaxInt64 {
			return int64(v), true
		}
		return 0, false
	case float64:
		// 如果是 JSON 解出来的数字，大概率是 float64
		if math.Trunc(v) == v && v >= math.MinInt64 && v <= math.MaxInt64 {
			return int64(v), true
		}
		return 0, false
	case json.Number:
		if i, err := v.Int64(); err == nil {
			return i, true
		}
		return 0, false
	case string:
		if i, err := strconv.ParseInt(v, 10, 64); err == nil {
			return i, true
		}
		return 0, false
	default:
		// 也可能是 *json.Number、*string 这类
		rv := reflect.ValueOf(x)
		if rv.Kind() == reflect.Ptr && !rv.IsNil() {
			return ToInt64(rv.Elem().Interface())
		}
		return 0, false
	}
}

func GetValueFromParams(params gin.Params, key string, format string) (any, bool) {
	value, err := params.Get(key)
	if !err {
		return "", false
	}

	switch format {
	case "int64":
		parseInt, ok := ToInt64(value)
		if !ok {
			return 0, false
		}
		return parseInt, true
	default:
		// 默认不做任何处理
		return value, true
	}
}
