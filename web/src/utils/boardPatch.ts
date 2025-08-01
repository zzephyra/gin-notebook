// src/utils/boardPatch.ts
import { ToDoColumn, ProjectBoard, TodoTask } from '@/components/todo/type';

export function addTaskToColumnEnd(board: ProjectBoard, columnId: string, task: TodoTask): ProjectBoard {
    return board.map((col: ToDoColumn) => col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col);
}

export function replaceTaskById(board: ProjectBoard, columnId: string, id: string, patch: Partial<TodoTask>): ProjectBoard {
    return board.map(col => {
        if (col.id !== columnId) return col;
        return { ...col, tasks: col.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)) };
    });
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
