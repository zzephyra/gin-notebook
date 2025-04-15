package main

import (
	"gin-notebook/configs"
	"gin-notebook/internal/tasks"
	"gin-notebook/pkg/logger"
	"log"

	"github.com/hibiken/asynq"
)

func InitAsyncq() (srv *asynq.Server, mux *asynq.ServeMux) {
	// 初始化异步队列
	srv = asynq.NewServer(
		asynq.RedisClientOpt{Addr: configs.Configs.Cache.Host + ":" + configs.Configs.Cache.Port},
		asynq.Config{
			Concurrency: 5,
		},
	)

	mux = asynq.NewServeMux()
	mux.HandleFunc(tasks.TypeEmailDelivery, tasks.SendEmailTask)
	logger.LogInfo("🚀 Asynq Worker 启动中...", map[string]interface{}{})
	return
}

func main() {
	// 加载配置文件
	configs.Load()

	// 初始化Asyncq
	srv, mux := InitAsyncq()

	// 启动异步任务处理器

	if err := srv.Run(mux); err != nil {
		log.Fatalf("Worker 启动失败: %v", err)
	}

}
