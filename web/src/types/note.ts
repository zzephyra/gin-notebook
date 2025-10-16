export interface CategoryType {
    id: string;
    category_name: string;
}

export type TextStyles = {
    bold?: boolean; italic?: boolean; underline?: boolean;
    strikethrough?: boolean; code?: boolean; color?: string;
};

export type InlineDTO = { type: "text"; text: string; styles: TextStyles };

export type IncomingBlock = {
    id: string;                 // BlockNote 的 block.id → node_uid
    type: string;               // "paragraph" | "heading" | ...
    props: Record<string, any>; // 直接透传（level/textAlignment 等）
    content: InlineDTO[];       // 文本 runs（这里只放最常用的 text）
    parentId: string;           // 顶层用 ""（空串）

    order: number;          // ← 显式带上
    depth?: number;             // heading 层级（若有）
};

export type PartialUpdate = {
    type?: string;
    props?: Record<string, any>;
    content?: InlineDTO[];
    depth?: number;
};

export type PatchOp =
    | { op: "insert"; block: IncomingBlock; afterId?: string | null; beforeId?: string | null; }
    | { op: "update"; node_uid: string; patch: PartialUpdate }
    | { op: "move"; order: number; node_uid: string; new_parent_uid?: string | null; afterId?: string | null; beforeId?: string | null }
    | { op: "delete"; node_uid: string };

export type PatchRequest = {
    ops: PatchOp[];
    base_version?: number; // 可选：乐观并发
};