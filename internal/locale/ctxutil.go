// internal/locale/ctxutil.go
package locale

import (
	"context"

	goi18n "github.com/nicksnyder/go-i18n/v2/i18n"
)

type ctxKey string

const (
	keyLocale    ctxKey = "locale"
	keyLocalizer ctxKey = "localizer"
)

func WithLocale(ctx context.Context, locale string) context.Context {
	return context.WithValue(ctx, keyLocale, locale)
}
func WithLocalizer(ctx context.Context, loc *goi18n.Localizer) context.Context {
	return context.WithValue(ctx, keyLocalizer, loc)
}
func FromLocale(ctx context.Context) string {
	if v := ctx.Value(keyLocale); v != nil {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "zh-CN"
}
func FromLocalizer(ctx context.Context, fallback *goi18n.Localizer) *goi18n.Localizer {
	if v := ctx.Value(keyLocalizer); v != nil {
		if l, ok := v.(*goi18n.Localizer); ok && l != nil {
			return l
		}
	}
	return fallback
}
