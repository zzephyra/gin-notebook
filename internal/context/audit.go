package auditContext

import "context"

type Meta struct {
	RequestID string
	IP        string
	UA        string
}

type metaKeyT struct{}

var metaKey metaKeyT

// 将元信息塞进 context
func IntoContext(ctx context.Context, m Meta) context.Context {
	return context.WithValue(ctx, metaKey, m)
}

// 从 context 取元信息（不存在就返回零值）
func FromContext(ctx context.Context) Meta {
	if v := ctx.Value(metaKey); v != nil {
		if m, ok := v.(Meta); ok {
			return m
		}
	}
	return Meta{}
}
