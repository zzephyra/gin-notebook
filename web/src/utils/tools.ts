export const getScriptFromLang = (lang: string) => {
    if (["zh-CN", "zh-SG", "zh-Hans"].includes(lang)) return "zh_cn";
    if (["zh-TW", "zh-HK", "zh-MO", "zh-Hant"].includes(lang)) return "zh_tw";
    return lang.split("-")[0];
};

export const getSystemLang = () => {
    const lang = navigator.language;
    const script = getScriptFromLang(lang);
    return script || "en";
}

export function formDataToJSON(formData: FormData): Record<string, any> {
    const data: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    return data;
}

export function checkFileType(file: File, assertType: string) {
    var type = file.type.split('/')[0]
    return type == assertType
}

export function generateInviteUrl(uuid: string) {
    return `${window.location.origin}/invite/${uuid}`
}