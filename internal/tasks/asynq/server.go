package asynqimpl

import "github.com/hibiken/asynq"

type ServerConfig struct {
	RedisAddr   string
	RedisPass   string
	RedisDB     int
	Concurrency int
	Queues      map[string]int // e.g. {"critical":20,"default":10,"low":5}
}

func NewServer(cfg ServerConfig) *asynq.Server {
	return asynq.NewServer(
		asynq.RedisClientOpt{Addr: cfg.RedisAddr, Password: cfg.RedisPass, DB: cfg.RedisDB},
		asynq.Config{
			Concurrency: cfg.Concurrency,
			Queues:      cfg.Queues,
		},
	)
}
