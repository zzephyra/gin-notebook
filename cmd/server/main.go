package main

import (
	"gin-notebook/configs"
	"gin-notebook/internal/api"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/pkg/logger"
)

func Stop() {
	// 关闭redis连接
	cache.CloseRedisClient()
}

func main() {
	config := configs.Load()
	defer Stop()
	// 初始化日志
	logger.InitLogger(*config)

	// 连接数据库
	database.ConnectDB(config)

	// 连接redis
	err := cache.InitRedisClinet(*config)
	if err != nil {
		panic(err)
	}

	// 设置路由
	var router = api.SetRouter()
	router.Run("0.0.0.0:8899") // 监听并在 0.0.0.0:8080 上启动服务
}
