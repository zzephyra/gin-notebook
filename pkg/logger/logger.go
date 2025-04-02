package logger

import "github.com/rs/zerolog/log"

func LogError(err error, message string) {
	log.Error().Err(err).Msg(message)
}

func LogInfo(message string, fields map[string]interface{}) {
	logEvent := log.Info()
	for k, v := range fields {
		logEvent = logEvent.Interface(k, v)
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
