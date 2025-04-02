package logger

import (
	"gin-notebook/configs"

	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func InitLogger(c configs.Config) {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	zerolog.SetGlobalLevel(zerolog.InfoLevel) // 设置全局日志级别
	if c.Server.Debug {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}

	// 控制台输出，带颜色
	consoleWriter := zerolog.ConsoleWriter{
		Out:        os.Stderr,
		TimeFormat: time.RFC3339,
	}

	log.Logger = log.Output(consoleWriter)

	// 也可以同时输出到文件
	// file, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	// if err == nil {
	//     multi := zerolog.MultiLevelWriter(consoleWriter, file)
	//     log.Logger = log.Output(multi)
	// }
}
