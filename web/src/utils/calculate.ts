export function formatFileSize(bytes: number): string {
    const KB = 1024;        // 1 KB = 1024 B
    const MB = KB * 1024;   // 1 MB = 1024 KB

    if (bytes < MB) {
        // 四舍五入到整数 KB；最小值 1 KB，避免显示 0 KB
        return `${Math.max(1, Math.round(bytes / KB))} KB`;
    }

    // 保留 1 位小数；例如 1.3 MB
    return `${(bytes / MB).toFixed(1)} MB`;
}