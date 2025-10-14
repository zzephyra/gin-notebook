package asynqimpl

import (
	"time"

	"gin-notebook/internal/tasks/asynq/types"
	"gin-notebook/pkg/logger"

	"github.com/hibiken/asynq"
)

type SchedulerConfig struct {
	RedisOpt asynq.RedisClientOpt
	Location *time.Location // 传入 time.Local 或具体时区
}

type Scheduler struct {
	inner *asynq.Scheduler
}

func RunScheduler(redisAddr, port, password string, db int) (*Scheduler, error) {
	s := NewScheduler(redisAddr, port, password, db)
	if err := s.RegisterSpecs(); err != nil {
		return nil, err
	}
	s.RunAsync()
	return s, nil
}

func NewScheduler(redisAddr, port, password string, db int) *Scheduler {
	s := asynq.NewScheduler(asynq.RedisClientOpt{
		Addr:     redisAddr + ":" + port,
		Password: password,
		DB:       db,
	}, nil)
	return &Scheduler{inner: s}
}

func (s *Scheduler) RegisterSpecs() error {
	if _, err := s.inner.Register("@every 10m", types.NewFeishuRefreshAllUserTokensTask()); err != nil {
		return err
	}

	return nil
}

func (s *Scheduler) RunAsync() {
	go func() {
		if err := s.inner.Run(); err != nil {
			logger.LogError(err, "asynq scheduler stopped")
		}
	}()
}

func (s *Scheduler) Shutdown() {
	s.inner.Shutdown()
}
