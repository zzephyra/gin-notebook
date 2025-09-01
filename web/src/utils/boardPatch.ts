// src/utils/boardPatch.ts
import { ToDoColumn, ProjectBoard, TodoTask } from '@/components/todo/type';

export function addTaskToColumnEnd(board: ProjectBoard, columnId: string, task: TodoTask): ProjectBoard {
    return board.map((col: ToDoColumn) => col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col);
}

export function replaceTaskById(
    board: ProjectBoard,
    columnId: string,
    id: string,
    patch: Partial<TodoTask>,
    insertIndex?: number, // 目标插入位置；缺省则末尾
): ProjectBoard {
    const fromColIdx = board.findIndex((c) => c.id === columnId);
    if (fromColIdx === -1) return board;

    const fromTasks = board[fromColIdx].tasks;
    const taskIdx = fromTasks.findIndex((t) => t.id === id);
    if (taskIdx === -1) return board;

    const oldTask = fromTasks[taskIdx];
    const updatedTask: TodoTask = { ...oldTask, ...patch };

    const toColumnId = updatedTask.column_id ?? columnId;
    const movingToOtherColumn = toColumnId !== columnId;
    const wantsReorderInSameColumn =
        !movingToOtherColumn && insertIndex !== undefined && insertIndex !== taskIdx;

    // 如果既没有字段变化，也没有换列，也没有同列重排，就直接返回
    const hasFieldChange =
        Object.keys(patch).length > 0 &&
        !Object.entries(patch).every(([k, v]) => (oldTask as any)[k] === v);

    if (!hasFieldChange && !movingToOtherColumn && !wantsReorderInSameColumn) {
        return board;
    }

    // 目标列索引
    const toColIdx = board.findIndex((c) => c.id === toColumnId);
    if (toColIdx === -1) return board;

    // 生成新 board（浅拷贝外层）
    const next = board.slice();

    // 1) 先从原列移除
    const nextFromTasks = fromTasks.slice(0, taskIdx).concat(fromTasks.slice(taskIdx + 1));
    next[fromColIdx] = { ...board[fromColIdx], tasks: nextFromTasks };

    // 2) 计算目标插入位置与目标任务数组
    const toTasksOrig = board[toColIdx].tasks;
    const toTasksBase =
        movingToOtherColumn
            ? toTasksOrig // 跨列移动：直接用原目标列
            : // 同列重排：注意我们上面已经移除了该任务，目标列就是 nextFromTasks
            nextFromTasks;

    const pos =
        insertIndex === undefined
            ? taskIdx
            : Math.max(0, Math.min(insertIndex, toTasksBase.length)); // 夹取边界

    // 3) 插入到目标列
    const nextToTasks =
        pos === 0
            ? [updatedTask, ...toTasksBase]
            : pos === toTasksBase.length
                ? [...toTasksBase, updatedTask]
                : [...toTasksBase.slice(0, pos), updatedTask, ...toTasksBase.slice(pos)];

    next[toColIdx] = { ...board[toColIdx], tasks: nextToTasks };

    return next;
}


export function removeTaskById(board: ProjectBoard, columnId: string, id: string): ProjectBoard {
    return board.map(col => col.id === columnId ? { ...col, tasks: col.tasks.filter(t => t.id !== id) } : col);
}

export function findTask(board: ProjectBoard, id: string): { columnId: string; index: number; task: TodoTask } | null {
    for (const col of board) {
        const idx = col.tasks.findIndex(t => t.id === id);
        if (idx !== -1) return { columnId: col.id, index: idx, task: col.tasks[idx] };
    }
    return null;
}

export function replaceColumnById(board: ProjectBoard, columnId: string, patch: Partial<ToDoColumn>): ProjectBoard {
    return board.map(col => col.id === columnId ? { ...col, ...patch } : col);
}