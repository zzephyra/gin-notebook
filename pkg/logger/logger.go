package logger

import (
	"fmt"
	"reflect"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func LogError(err error, message string) {
	log.Error().Err(err).Msg(message)
}

func LogDebug(message string, fields map[string]interface{}) {
	logEvent := log.Debug()
	for k, v := range fields {
		logEvent = logEvent.Interface(k, v)
	}
	logEvent.Msg(message)
}

func LogInfo(message string, fields ...any) {
	e := log.Info()

	if len(fields) == 0 {
		e.Msg(message)
		return
	}

	if len(fields) == 1 {
		e = addOne(e, fields[0])
		e.Msg(message)
		return
	}

	// 多参数：偶数视为键值对；奇数按位置参数 argN
	if len(fields)%2 == 0 {
		for i := 0; i < len(fields); i += 2 {
			key := fmt.Sprint(fields[i]) // 宽松转换，容错更高
			val := fields[i+1]
			e = e.Interface(key, val)
		}
	} else {
		for i, v := range fields {
			e = e.Interface(fmt.Sprintf("arg%d", i+1), v)
		}
	}

	e.Msg(message)
}

func addOne(e *zerolog.Event, v any) *zerolog.Event {
	val := reflect.ValueOf(v)
	if !val.IsValid() {
		return e
	}

	// 解引用指针
	for val.Kind() == reflect.Ptr {
		if val.IsNil() {
			return e
		}
		val = val.Elem()
	}

	switch val.Kind() {
	case reflect.Map:
		for _, k := range val.MapKeys() {
			key := fmt.Sprint(k.Interface())
			e = e.Interface(key, val.MapIndex(k).Interface())
		}
	case reflect.Struct:
		e = addStructFields(e, val)
	default:
		e = e.Interface("data", v)
	}

	return e
}

func addStructFields(e *zerolog.Event, val reflect.Value) *zerolog.Event {
	typ := val.Type()
	for i := 0; i < val.NumField(); i++ {
		sf := typ.Field(i)

		// 只导出公开字段
		if sf.PkgPath != "" {
			continue
		}

		// 优先 log/json 标签名（支持 omitempty 等，逗号前为名）
		name := firstNonEmpty(tagBase(sf.Tag.Get("log")), tagBase(sf.Tag.Get("json")), sf.Name)
		if name == "-" {
			continue
		}

		e = e.Interface(name, val.Field(i).Interface())
	}
	return e
}

func tagBase(tag string) string {
	if tag == "" {
		return ""
	}
	for i := 0; i < len(tag); i++ {
		if tag[i] == ',' {
			return tag[:i]
		}
	}
	return tag
}

func firstNonEmpty(ss ...string) string {
	for _, s := range ss {
		if s != "" {
			return s
		}
	}
	return ""
}
