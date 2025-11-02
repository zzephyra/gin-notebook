export const isValidUrl = (s?: string) => {
    if (!isNonEmpty(s)) return false;
    try { new URL(s!); return true; } catch { return false; }
};

export const isNonEmpty = (s?: string) => typeof s === "string" && s.trim().length > 0;
export const isPositiveInt = (n: unknown) =>
    typeof n === "number" && Number.isInteger(n) && n > 0;