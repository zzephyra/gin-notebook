package main

import (
	"gin-notebook/cmd/startup"
	"gin-notebook/configs"
	"gin-notebook/internal/api"
	"gin-notebook/internal/pkg/cache"
	"gin-notebook/internal/pkg/database"
	"gin-notebook/internal/pkg/geoip"
	"gin-notebook/internal/pkg/google"
	"gin-notebook/internal/pkg/queue"
	"gin-notebook/internal/pkg/rbac"
	"gin-notebook/internal/pkg/realtime/bus"
	asynqimpl "gin-notebook/internal/tasks/asynq"
	"gin-notebook/pkg/logger"
	"gin-notebook/pkg/utils/algorithm"
	"gin-notebook/pkg/utils/validator"
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

	// 连接数据库
	database.ConnectDB(config, true)
	logger.LogInfo("Database connect success", nil)

	// 连接redis
	err = cache.InitRedisClinet(*config)
	if err != nil {
		panic(err)
	}

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

	startup.Init()

	// 初始化mmdb
	geoip.InitGeoIP(config.GeoIP.DBPath)

	// 初始化asynq
	asynqimpl.InitGlobal(config.Cache.Host, config.Cache.Port, config.Cache.Password, config.Cache.DB)

	// 初始化Google OAuth2客户端
	google.Init(config)

	// sse 实时通信
	broker := bus.NewBroker(128)
	bus.Use(broker)                               // 给路由处理器/订阅用
	bus.UsePublisher(bus.NewSSEPublisher(broker)) // 给业务发布用

	// websocket 初始化
	wsPub := bus.NewRedisWsPublisher(cache.RedisInstance.Client)
	bus.UseWsPublisher(wsPub)

	// 设置路由
	var router = api.SetRouter()
	router.Run("0.0.0.0:8899") // 监听并在 0.0.0.0:8899 上启动服务
}
