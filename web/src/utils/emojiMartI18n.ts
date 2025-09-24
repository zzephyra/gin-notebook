import zh from '@emoji-mart/data/i18n/zh.json'
import en from '@emoji-mart/data/i18n/en.json'

export function pickEmojiMartI18n(locale: string) {
    const l = locale.toLowerCase()
    if (l.startsWith('zh')) return zh as any
    return en as any
}