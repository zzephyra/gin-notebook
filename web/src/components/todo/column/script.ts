import { TaskState } from "../type"

export const ToDoColumnClasses = [
    "!bg-(--todo-pending-bg-light) !dark:bg-(--todo-pending-bg-dark) !text-gray-700 !dark:text-gray-200",
    "!bg-(--todo-processing-bg-light) !dark:bg-(--todo-processing-bg-dark) !text-gray-700 dark:text-gray-200",
    "!bg-(--todo-completed-bg-light) !dark:bg-(--todo-completed-bg-dark) !text-gray-700 !dark:text-gray-200",
]

export const isCardOver: TaskState = {
    type: 'is-card-over',
}