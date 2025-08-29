package logger

import (
	"reflect"

	"github.com/rs/zerolog/log"
)

func LogError(err error, message string) {
	log.Error().Err(err).Msg(message)
}

func LogInfo(message string, fields any) {
	logEvent := log.Info()

	if fields == nil {
		logEvent.Msg(message)
		return
	}

	val := reflect.ValueOf(fields)
	switch val.Kind() {
	case reflect.Map:
		for _, key := range val.MapKeys() {
			logEvent = logEvent.Interface(key.String(), val.MapIndex(key).Interface())
		}
	case reflect.Struct:
		typ := val.Type()
		for i := 0; i < val.NumField(); i++ {
			fieldName := typ.Field(i).Name
			fieldValue := val.Field(i).Interface()
			logEvent = logEvent.Interface(fieldName, fieldValue)
		}
	default:
		logEvent = logEvent.Interface("data", fields)
	}

	logEvent.Msg(message)
}

func LogDebug(message string, fields map[string]interface{}) {
	logEvent := log.Debug()
	for k, v := range fields {
		logEvent = logEvent.Interface(k, v)
	}
	logEvent.Msg(message)
}
