import { cardDropTargetKey, cardKey, columnKey, TCardData, TCardDropTargetData, TColumnData, TodoTask } from "./type";


export function getCardData({
    task,
    rect,
    columnId,
}: Omit<TodoTask, typeof cardKey> & { columnId: string }): TCardData {
    return {
        [cardKey]: true,
        rect,
        task,
        columnId,
    };
}

export function isCardData(value: Record<string | symbol, unknown>): value is TCardData {
    return Boolean(value[cardKey]);
}

export function isCardDropTargetData(
    value: Record<string | symbol, unknown>,
): value is TCardDropTargetData {
    return Boolean(value[cardDropTargetKey]);
}

export function isColumnData(value: Record<string | symbol, unknown>): value is TColumnData {
    return Boolean(value[columnKey]);
}



export function getCardDropTargetData({
    task,
    columnId,
}: Omit<TodoTask, typeof cardDropTargetKey> & {
    columnId: string;
}): TCardDropTargetData {
    return {
        [cardDropTargetKey]: true,
        task,
        columnId,
    };
}

