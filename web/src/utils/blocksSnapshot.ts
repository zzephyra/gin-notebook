// blocksSnapshot.ts
import { PatchOp } from "@/types/note";
import {
  Block,
  InlineContent,
  TableContent,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
} from "@blocknote/core";

/**
 * 如果你有自定义 schema，把下面三行换成你自己的类型参数：
 *   type B = MyBlockSchema; type I = MyInlineContentSchema; type T = MyStyleSchema;
 */
type B = DefaultBlockSchema;
type I = DefaultInlineContentSchema;
type T = DefaultStyleSchema;
type UID = string;

/** 与后端约定的最小文本片段结构（可按需扩展 link/mention 等） */
export type TextStyles = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
};
export type InlineDTO = { type: "text"; text: string; styles: TextStyles };

/** 扁平后的块（用于前端 diff / 生成 patch） */
export type FlatBlock = {
  id: string;               // block.id → 后端的 node_uid
  type: string;             // "paragraph" | "heading" | "table" ...
  props: Record<string, any>;
  parentId: string;         // 顶层用 ""
  order: number;            // 同级序号
  runs: InlineDTO[];        // 统一抽取后的文本 runs（表格会合并所有单元格文本）
  depth?: number;           // heading 的 level（可选）
};

/** 内联内容抽取（只处理 text；如需 link/mention，可在此扩展） */
export function extractRunsFromInline(
  content: InlineContent<I, T>[]
): InlineDTO[] {
  const out: InlineDTO[] = [];
  if (!Array.isArray(content)) return out;

  for (const item of content) {
    // 默认 inline 有 "text"（也可能有 link/mention，按需扩展）
    const anyItem = item as any;
    if (anyItem?.type === "text") {
      out.push({
        type: "text",
        text: String(anyItem.text ?? ""),
        styles: (anyItem.styles ?? {}) as TextStyles,
      });
    }
    // TODO: 扩展 link/mention 等：
    // else if (anyItem?.type === "link") { ... }
  }
  return out;
}

/** 表格内容抽取：遍历 rows -> cells -> content(InlineContent[]) 并汇总为 runs */
export function extractRunsFromTable(
  table: TableContent<I, T>
): InlineDTO[] {
  const out: InlineDTO[] = [];
  const rows = (table as any)?.rows as Array<any> | undefined;
  if (!rows?.length) return out;

  for (const row of rows) {
    const cells = row?.cells as Array<any> | undefined;
    if (!cells?.length) continue;
    for (const cell of cells) {
      const cellContent = (cell?.content ?? []) as InlineContent<I, T>[];
      out.push(...extractRunsFromInline(cellContent));
    }
  }
  return out;
}

/** 统一入口：既能处理 InlineContent[]，也能处理 TableContent */
export function extractRunsAny(
  content: InlineContent<I, T>[] | TableContent<I, T> | undefined
): InlineDTO[] {
  if (!content) return [];
  // 数组 → 当作 inline
  if (Array.isArray(content)) {
    return extractRunsFromInline(content as InlineContent<I, T>[]);
  }
  // 否则视为表格
  return extractRunsFromTable(content as TableContent<I, T>);
}

/**
 * 将 BlockNote 的文档树“拍扁”为一维列表，便于对比与生成 patch。
 * - 对于普通块：从 block.content(InlineContent[]) 抽取 runs
 * - 对于表格块：从 TableContent 抽取所有单元格的 runs 并合并
 * - parentId：父块的 id，顶层为 ""
 * - order：同级的顺序（0-based）
 * - depth：如果是 heading 且 props.level 为 number，则设为对应层级
 */
export function flattenDocument(
  doc: Block<B, I, T>[]
): FlatBlock[] {
  const result: FlatBlock[] = [];

  const walk = (nodes: Block<B, I, T>[], parentId: string) => {
    nodes.forEach((b, idx) => {
      const anyBlock = b as any;

      // 统一抽取 runs：表格与普通块分别处理
      const isTable = anyBlock?.type === "table";
      const runs = isTable
        ? extractRunsAny(anyBlock?.content as TableContent<I, T>)
        : extractRunsAny(anyBlock?.content as InlineContent<I, T>[]);

      // props 透传（便于后端进行细粒度更新）
      const props: Record<string, any> = (anyBlock?.props ?? {}) as Record<
        string,
        any
      >;

      const fb: FlatBlock = {
        id: String(anyBlock?.id ?? ""),
        type: String(anyBlock?.type ?? ""),
        props,
        parentId,
        order: idx,
        runs,
      };

      // heading level → depth
      const level = props?.level;
      if (fb.type === "heading" && typeof level === "number") {
        fb.depth = level;
      }

      result.push(fb);

      // 递归 children
      const children = (anyBlock?.children ?? []) as Block<B, I, T>[];
      if (children.length) {
        walk(children, fb.id);
      }
    });
  };

  walk(doc, "");
  return result;
}

// 建议放到文件顶部工具区
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a && b && typeof a === "object" && typeof b === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
      // 不立即返回 false，可能是删除/新增键，需要逐键比较
      const all = new Set([...aKeys, ...bKeys]);
      for (const k of all) if (!deepEqual(a[k], b[k])) return false;
      return true;
    }
    for (const k of aKeys) if (!deepEqual(a[k], b[k])) return false;
    return true;
  }
  // NaN 情况
  return Number.isNaN(a) && Number.isNaN(b);
}


function lcs<T>(a: T[], b: T[]): T[] {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const seq: T[] = [];
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { seq.push(a[i - 1]); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return seq.reverse();
}

function groupByParent(blocks: FlatBlock[]): Map<UID | null, FlatBlock[]> {
  const mp = new Map<UID | null, FlatBlock[]>();
  for (const b of blocks) {
    const k = (b.parentId ?? null) as UID | null;
    if (!mp.has(k)) mp.set(k, []);
    mp.get(k)!.push(b);
  }
  for (const arr of mp.values()) arr.sort((a, b) => a.order - b.order);
  return mp;
}

function computeMovedIdsByLCS(oldBlocks: FlatBlock[], newBlocks: FlatBlock[]): Set<UID> {
  const moved = new Set<UID>();
  const oldByParent = groupByParent(oldBlocks);
  const newByParent = groupByParent(newBlocks);
  const parents = new Set<UID | null>([...oldByParent.keys(), ...newByParent.keys()]);

  for (const p of parents) {
    const oldArr = oldByParent.get(p) ?? [];
    const newArr = newByParent.get(p) ?? [];
    const oldIds = oldArr.map(b => b.id as UID);
    const newIds = newArr.map(b => b.id as UID);

    // 已被新增/删除的不参与 move 计算（insert/delete 由别处处理）
    const oldIdsFiltered = oldIds.filter(id => newIds.includes(id));
    const newIdsFiltered = newIds.filter(id => oldIds.includes(id));

    const keep = new Set<UID>(lcs(oldIdsFiltered, newIdsFiltered));
    // 不在 LCS 的，就是“真正需要移动”的
    for (const id of newIdsFiltered) {
      if (!keep.has(id)) moved.add(id);
    }
  }
  return moved;
}

export function diffSnapshots(oldBlocks: FlatBlock[], newBlocks: FlatBlock[]): PatchOp[] {
  const oldMap = new Map(oldBlocks.map((b) => [b.id, b]));
  const newMap = new Map(newBlocks.map((b) => [b.id, b]));
  const ops: PatchOp[] = [];

  // 1) insert
  for (const nb of newBlocks) {
    if (!oldMap.has(nb.id)) {
      const siblings = newBlocks
        .filter((b) => b.parentId === nb.parentId)
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((s) => s.id === nb.id);
      const afterId = idx > 0 ? siblings[idx - 1].id : null;
      const beforeId = idx < siblings.length - 1 ? siblings[idx + 1].id : null;

      ops.push({
        op: "insert",
        block: {
          id: nb.id,
          type: nb.type,
          props: nb.props,
          parentId: nb.parentId,
          order: nb.order,
          content: nb.runs,
          depth: nb.depth,
        },
        afterId,
        beforeId,
      });
    }
  }

  // 2) delete
  for (const ob of oldBlocks) {
    if (!newMap.has(ob.id)) {
      ops.push({ op: "delete", node_uid: ob.id });
    }
  }

  // 3) move：只判断结构差异（parentId / 邻接顺序）
  const movedIds = computeMovedIdsByLCS(oldBlocks, newBlocks);

  for (const nb of newBlocks) {
    const ob = oldMap.get(nb.id);
    if (!ob) continue;
    if (!movedIds.has(nb.id as UID)) continue;

    const siblings = newBlocks
      .filter(b => (b.parentId ?? null) === (nb.parentId ?? null))
      .sort((a, b) => a.order - b.order);
    const pos = siblings.findIndex(x => x.id === nb.id);
    const afterId = pos > 0 ? siblings[pos - 1].id : null;
    const beforeId = pos < siblings.length - 1 ? siblings[pos + 1].id : null;

    ops.push({
      op: "move",
      node_uid: nb.id,
      new_parent_uid: nb.parentId ?? null,
      afterId,
      beforeId,
      order: nb.order,
    });
  }

  // 4) update：非结构字段变化则发送完整 block
  for (const nb of newBlocks) {
    const ob = oldMap.get(nb.id);
    if (!ob) continue;

    // 仅检测非结构字段差异：type / props / content(runs)
    const typeChanged = ob.type !== nb.type;
    const propsChanged = !deepEqual(ob.props, nb.props);
    const contentChanged = !deepEqual(ob.runs, nb.runs);

    if (typeChanged || propsChanged || contentChanged) {
      // 注意：这里按“完整块”发送；如果后端不希望结构字段在 update 中生效，可在后端忽略 parentId/order/depth
      ops.push({
        op: "update",
        node_uid: nb.id,
        block: {
          id: nb.id,
          type: nb.type,
          props: nb.props,
          parentId: nb.parentId,
          order: nb.order,
          content: nb.runs,
          depth: nb.depth,
        },
      } as PatchOp);
    }
  }

  return ops;
}
