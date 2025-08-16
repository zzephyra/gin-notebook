import { MentionPayload } from "./main/type";

// 遇到 mention 时，删除整个 mention
export const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    const sel = document.getSelection();
    if (!sel || !sel.isCollapsed) return;

    let target: HTMLElement | null = null;
    console.log(e.key)
    if (e.key === 'Backspace') {
        // 光标在 mention 尾部
        const prev = sel.anchorNode?.previousSibling as HTMLElement | null;
        if (prev?.classList?.contains('mention')) target = prev;
    } else {
        // Delete：光标在 mention 前
        const next = sel.anchorNode?.nextSibling as HTMLElement | null;
        if (next?.classList?.contains('mention')) target = next;
    }

    if (target) {
        e.preventDefault();
        target.remove();
    }
};

export function calcInContainer(
    anchorRect: DOMRect,
    containerEl: HTMLElement,
    dropdownSize: { w: number; h: number },
    gap = 6
) {
    const box = containerEl.getBoundingClientRect();
    const scrollX = containerEl.scrollLeft;
    const scrollY = containerEl.scrollTop;

    // 视口坐标 -> 容器内部坐标（加滚动）
    let left = anchorRect.left - box.left + scrollX;
    let top = anchorRect.bottom - box.top + scrollY + gap;

    const spaceBelow = (box.bottom - anchorRect.bottom) + scrollY;
    const spaceAbove = (anchorRect.top - box.top) + scrollY;

    if (spaceBelow < dropdownSize.h + gap && spaceAbove > dropdownSize.h + gap) {
        top = anchorRect.top - box.top + scrollY - gap - dropdownSize.h;
    }

    // clamp 到容器范围（含滚动偏移）
    left = Math.max(scrollX, Math.min(left, scrollX + box.width - dropdownSize.w));
    top = Math.max(scrollY, Math.min(top, scrollY + box.height - dropdownSize.h));

    return { left, top };
}

export function getLastLineRect(el: HTMLElement): DOMRect {
    const rects = el.getClientRects();
    return rects.length ? rects[rects.length - 1] : el.getBoundingClientRect();
}

export function calcInViewport(anchorRect: DOMRect, size: { w: number; h: number }, gap = 6) {
    let left = Math.min(Math.max(0, anchorRect.left), window.innerWidth - size.w);
    let top = anchorRect.bottom + gap;

    const below = window.innerHeight - anchorRect.bottom;
    const above = anchorRect.top;

    if (below < size.h + gap && above > size.h + gap) {
        top = anchorRect.top - gap - size.h; // 翻到上面
    }

    top = Math.min(Math.max(0, top), window.innerHeight - size.h);
    return { left, top };
}


export function extractCommentPayload(root: HTMLElement) {
    let text = '';
    const mentions: MentionPayload[] = [];

    const walk = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (el.classList.contains('mention')) {
                const label = el.innerText.replace(/^@?/, ''); // 确保前面带@
                const atText = `@${label}`;
                const start = text.length;           // 注意：这是 UTF-16 下标
                text += atText;
                const end = text.length;
                mentions.push({
                    member_id: el.dataset.uid!,
                    label,
                    start_rune: start,
                    end_rune: end,
                });
                return; // mention 视为原子
            }
            // 非 mention：继续递归子节点
            el.childNodes.forEach(walk);
            return;
        }
        if (node.nodeType === Node.TEXT_NODE) {
            text += (node as Text).data;
        }
    };

    walk(root);
    // 归一化换行/空白（与你业务一致即可）
    text = text.replace(/\u00A0/g, ' ');

    return { text, mentions };
}


export function splitByMentions(
    content: string,
    mentions: Array<MentionPayload>
) {
    const runes = Array.from(content); // 重要：按 code point
    const sorted = [...(mentions || [])].sort((a, b) => a.start_rune - b.start_rune);
    const parts: Array<
        | { type: 'text'; text: string }
        | { type: 'mention'; label: string; data: any }
    > = [];

    let i = 0;
    for (const m of sorted) {
        const s = Math.max(0, Math.min(m.start_rune, runes.length));
        const e = Math.max(s, Math.min(m.end_rune, runes.length));
        if (s > i) parts.push({ type: 'text', text: runes.slice(i, s).join('') });
        const label = runes.slice(s, e).join(''); // 原文里的“@xxx”
        parts.push({ type: 'mention', label, data: m });
        i = e;
    }
    if (i < runes.length) parts.push({ type: 'text', text: runes.slice(i).join('') });
    return parts;
}