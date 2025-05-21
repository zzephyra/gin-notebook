package main

import (
	"gin-notebook/cmd/startup"
	"gin-notebook/configs"
	"gin-notebook/internal/api"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/geoip"
	"gin-notebook/internal/pkg/queue"
	"gin-notebook/internal/pkg/rbac"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/algorithm"
	validator "gin-notebook/pkg/utils/validatior"
)

func Stop() {
	logger.LogInfo("开始执行结束函数", nil)
	// 关闭redis连接
	cache.RedisInstance.Close()
}

func main() {
	var err error
	config := configs.Load()
	defer Stop()
	// 初始化日志
	logger.InitLogger(*config)
	logger.LogInfo("logger init success", nil)

	// 创建雪花算法实例
	algorithm.NewSnowflake(1)
	logger.LogInfo("Snowflake init success", nil)
	logger.LogInfo("Start init casbin", nil)
	// 创建casbin实例
	err = rbac.NewEnforcer()
	if err != nil {
		logger.LogError(err, "casbin init error")
		panic(err)
	}

	// 注册验证器
	validator.RegisterValidator()

	// 连接Kafka，创建provider
	queue.NewProducerProvider()

	// 连接数据库
	database.ConnectDB(config)
	logger.LogInfo("Database connect success", nil)

	// 连接redis
	err = cache.InitRedisClinet(*config)
	if err != nil {
		panic(err)
	}

	startup.Init()

	// 初始化mmdb
	geoip.InitGeoIP(config.GeoIP.DBPath)

	// 设置路由
	var router = api.SetRouter()
	router.Run("0.0.0.0:8899") // 监听并在 0.0.0.0:8080 上启动服务
}
