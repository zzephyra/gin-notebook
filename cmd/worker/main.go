package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"gin-notebook/configs"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	asq "gin-notebook/internal/tasks/asynq"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/algorithm"
)

func main() {
	config := configs.Load()

	// 初始化日志
	logger.InitLogger(*config)
	logger.LogInfo("logger init success", nil)

	// 连接数据库
	database.ConnectDB(config, false)
	logger.LogInfo("Database connect success", nil)

	//初始化redis
	err := cache.InitRedisClinet(*config)
	if err != nil {
		panic(err)
	}

	// 创建雪花算法实例
	algorithm.NewSnowflake(1)
	logger.LogInfo("Snowflake init success", nil)

	// 启动asynq服务
	logger.LogInfo("configs loaded: ", configs.Configs.Cache.Host+":"+configs.Configs.Cache.Port)
	srv := asq.NewServer(asq.ServerConfig{
		RedisAddr:   configs.Configs.Cache.Host + ":" + configs.Configs.Cache.Port,
		Concurrency: 16,
		Queues:      map[string]int{"critical": 20, "default": 10, "low": 2},
	})
	mux := asq.NewMux()

	errCh := make(chan error, 1)
	go func() { errCh <- srv.Run(mux) }()

	// 优雅退出
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	select {
	case s := <-sig:
		log.Printf("shutting down by signal: %v", s)
		srv.Shutdown()
	case err := <-errCh:
		log.Fatalf("asynq server error: %v", err)
	}
}
