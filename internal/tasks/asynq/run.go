package asynqimpl

import (
	"fmt"
	"gin-notebook/internal/tasks/contracts"
	"sync"
)

var (
	globalOnce sync.Once

	client      contracts.Dispatcher // 对外暴露的是接口，便于替换/测试
	globalClose func() error         // 关闭函数，优雅退出用
)

// InitGlobal 进程启动时调用一次（main里）
// 建议把Redis配置从你的configs里传进来
func InitGlobal(redisAddr, port, password string, db int) {
	fmt.Println("asynqimpl.InitGlobal", redisAddr, port, password, db)
	globalOnce.Do(func() {
		cli := NewClient(redisAddr+":"+port, password, db)
		client = cli
		globalClose = cli.Close
	})
}

// Global 运行时获取 Dispatcher（若未初始化会panic，避免默默空指针）
func Dispatcher() contracts.Dispatcher {
	if client == nil {
		panic("asynqimpl.Global not initialized: call asynqimpl.InitGlobal(...) in main() first")
	}
	return client
}

// CloseGlobal 在进程退出时调用（main里defer），释放连接
func Close() error {
	if globalClose != nil {
		return globalClose()
	}
	return nil
}
