package locale

import (
	"strings"

	"golang.org/x/text/language"
)

var Supported = []language.Tag{
	language.SimplifiedChinese,
	language.English,
	language.Japanese,
	language.Korean,
}

var matcher = language.NewMatcher(Supported)

type Sources struct {
	// 原始字符串（无需依赖 gin），方便单测
	XLanguage      string // e.g. "en-US"
	AcceptLanguage string // e.g. "zh-CN,zh;q=0.9,en;q=0.8"
	UserPreference string // DB 中保存的用户偏好
	DefaultTag     language.Tag
}

func Resolve(s Sources) string {
	raw := strings.TrimSpace(s.XLanguage)
	if raw == "" {
		raw = strings.TrimSpace(s.AcceptLanguage)
	}
	if raw == "" {
		raw = strings.TrimSpace(s.UserPreference)
	}
	if raw == "" {
		raw = s.DefaultTag.String()
	}
	tag, _ := language.MatchStrings(matcher, raw)
	return tag.String()
}
