package repository

type QueryCondition struct {
	Field    string
	Operator string
	Value    interface{}
}

type DatabaseExtraOptions struct {
	WithLock bool // 是否加锁
}

type DatabaseExtraOpt func(*DatabaseExtraOptions)

func WithLock() DatabaseExtraOpt {
	return func(opt *DatabaseExtraOptions) {
		opt.WithLock = true
	}
}
