export const getScriptFromLang = (lang: string) => {
    if (["zh-CN", "zh-SG", "zh-Hans"].includes(lang)) return "zh_cn";
    if (["zh-TW", "zh-HK", "zh-MO", "zh-Hant"].includes(lang)) return "zh_tw";
    return lang.split("-")[0];
};

export const getSystemLang = () => {
    const lang = navigator.language;
    const script = getScriptFromLang(lang);
    console.log(script)
    return script || "en";
}