export type HashResult = { file: File; sha256: string };

export async function hashFilesSHA256(
    files: File[],
    opts: { concurrency?: number; onProgress?: (f: File, loaded: number, total: number) => void } = {}
): Promise<HashResult[]> {
    const concurrency =
        Math.max(1, Math.min(opts.concurrency ?? Math.max(2, Math.floor((navigator as any).hardwareConcurrency || 4) - 1), files.length));

    const results: HashResult[] = new Array(files.length);
    let i = 0;

    const toHex = (u8: Uint8Array) => {
        let out = '';
        for (let j = 0; j < u8.length; j++) out += u8[j].toString(16).padStart(2, '0');
        return out;
    };

    async function worker() {
        while (true) {
            const idx = i++;
            if (idx >= files.length) break;
            const f = files[idx];

            const buf = await f.arrayBuffer();
            opts.onProgress?.(f, buf.byteLength, buf.byteLength);

            const digest = await crypto.subtle.digest('SHA-256', buf);
            results[idx] = { file: f, sha256: toHex(new Uint8Array(digest)) };
        }
    }

    await Promise.all(Array.from({ length: concurrency }, worker));
    return results;
}
