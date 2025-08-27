// src/utils/boardPatch.ts
import { ToDoColumn, ProjectBoard, TodoTask } from '@/components/todo/type';

export function addTaskToColumnEnd(board: ProjectBoard, columnId: string, task: TodoTask): ProjectBoard {
    return board.map((col: ToDoColumn) => col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col);
}

export function replaceTaskById(
    board: ProjectBoard,
    columnId: string,
    id: string,
    patch: Partial<TodoTask>
): ProjectBoard {
    const fromColIdx = board.findIndex(c => c.id === columnId);
    if (fromColIdx === -1) return board;

    const fromTasks = board[fromColIdx].tasks;
    const taskIdx = fromTasks.findIndex(t => t.id === id);
    if (taskIdx === -1) return board;

    const oldTask = fromTasks[taskIdx];
    const updatedTask: TodoTask = { ...oldTask, ...patch };

    // 若没有任何字段实际变化，返回原对象，避免无效更新
    if (updatedTask === oldTask ||
        Object.keys(patch).length === 0 ||
        Object.entries(patch).every(([k, v]) => (oldTask as any)[k] === v)) {
        return board;
    }

    const toColumnId = updatedTask.column_id;
    const moving = toColumnId && toColumnId !== columnId;

    // —— 移动到其它列 —— //
    if (moving) {
        const toColIdx = board.findIndex(c => c.id === toColumnId);
        if (toColIdx === -1) {
            // 目标列不存在：按需选择直接返回或仅在原列内更新
            // 这里选择直接返回
            return board;
        }

        // 浅拷贝 board
        const next = board.slice();

        // 从原列移除
        const nextFromTasks = fromTasks.slice(0, taskIdx).concat(fromTasks.slice(taskIdx + 1));
        next[fromColIdx] = { ...board[fromColIdx], tasks: nextFromTasks };

        // 添加到目标列末尾（或你也可以按 order 插入）
        const toTasks = board[toColIdx].tasks;
        const nextToTasks = toTasks.concat(updatedTask);
        next[toColIdx] = { ...board[toColIdx], tasks: nextToTasks };

        return next;
    }

    // —— 未改变列，仅在原列内打补丁 —— //
    {
        const next = board.slice();
        const nextTasks = fromTasks.slice();
        nextTasks[taskIdx] = updatedTask;
        next[fromColIdx] = { ...board[fromColIdx], tasks: nextTasks };
        return next;
    }
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
