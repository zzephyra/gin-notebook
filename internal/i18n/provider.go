package i18n

import (
	"embed"
	"sync"

	"github.com/BurntSushi/toml"
	goi18n "github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
)

//go:embed locales/*.toml
var fs embed.FS

var (
	bundle  *goi18n.Bundle
	locPool sync.Map // locale -> *Localizer
)

func Init(defaultTag language.Tag) {
	bundle = goi18n.NewBundle(defaultTag)
	bundle.RegisterUnmarshalFunc("toml", toml.Unmarshal)
	_, _ = bundle.LoadMessageFileFS(fs, "locales/active.en.toml")
	_, _ = bundle.LoadMessageFileFS(fs, "locales/active.zh.toml")
	// ...更多语言按需加载
}

func NewLocalizer(locales ...string) *goi18n.Localizer {
	key := ""
	if len(locales) > 0 {
		key = locales[0]
	}
	if v, ok := locPool.Load(key); ok {
		return v.(*goi18n.Localizer)
	}
	l := goi18n.NewLocalizer(bundle, locales...)
	if key != "" {
		locPool.Store(key, l)
	}
	return l
}
