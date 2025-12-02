package asynqSingleton

import (
	"fmt"
	"sync"
	"time"

	"gin-notebook/internal/tasks/contracts"

	"github.com/hibiken/asynq"
)

var (
	globalOnce sync.Once

	client      contracts.Dispatcher // 对外暴露的是接口，便于替换/测试
	globalClose func() error         // 关闭函数，优雅退出用

	// ---- 新增：Scheduler 相关 ----
	schedMu          sync.Mutex
	scheduler        *asynq.Scheduler
	schedulerStarted bool
)

// InitGlobal 进程启动时调用一次（main里）
func InitGlobal(redisAddr, port, password string, db int) {
	fmt.Println("asynqimpl.InitGlobal", redisAddr, port, password, db)
	globalOnce.Do(func() {
		cli := NewClient(redisAddr+":"+port, password, db)
		client = cli

		// 合并关闭逻辑：优先关 scheduler，再关 client
		globalClose = func() error {
			schedMu.Lock()
			if scheduler != nil {
				scheduler.Shutdown()
			}
			schedMu.Unlock()
			return cli.Close()
		}
	})
}

// Dispatcher 运行时获取 Dispatcher（若未初始化会 panic，避免默默空指针）
func Dispatcher() contracts.Dispatcher {
	if client == nil {
		panic("asynqimpl.Global not initialized: call asynqimpl.InitGlobal(...) in main() first")
	}
	return client
}

// RegisterFn 由调用方提供的注册函数，在这里面做 s.Register("cron/@every", task)
type RegisterFn func(s *asynq.Scheduler) error

// StartScheduler 创建并启动 Scheduler（幂等，多次调用只生效一次）
func StartScheduler(redisAddr, port, password string, db int, loc *time.Location, register RegisterFn) error {
	schedMu.Lock()
	defer schedMu.Unlock()
	if schedulerStarted {
		return nil
	}

	opt := asynq.RedisClientOpt{
		Addr:     redisAddr + ":" + port,
		Password: password,
		DB:       db,
	}
	if loc == nil {
		loc = time.Local
	}
	scheduler = asynq.NewScheduler(opt, &asynq.SchedulerOpts{
		Location: loc,
	})

	// 让调用方注册要运行的定时任务
	if register != nil {
		if err := register(scheduler); err != nil {
			return err
		}
	}

	schedulerStarted = true
	go func() {
		// Run 会阻塞本 goroutine
		_ = scheduler.Run()
	}()
	return nil
}

// Close 在进程退出时调用（main里 defer），释放连接
func Close() error {
	if globalClose != nil {
		return globalClose()
	}
	return nil
}
