export function getPercent(p: any): number {
    // 兼容几种常见结构：0~1 / 0~100 / {percent} / {total:{percent}}
    let v: any =
        typeof p?.percent === 'number'
            ? p.percent
            : typeof p?.total?.percent === 'number'
                ? p.total.percent
                : typeof p === 'number'
                    ? p
                    : 0;
    if (v > 1.01) return Math.max(0, Math.min(100, Math.round(v)));
    return Math.max(0, Math.min(100, Math.round(v * 100)));
}