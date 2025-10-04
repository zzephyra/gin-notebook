import { TaskState } from "../type"

export const ToDoColumnClasses = [
    "dark:!bg-(--todo-pending-bg-dark) !text-gray-700 !dark:text-gray-200",
    "dark:!bg-(--todo-processing-bg-dark) !text-gray-700 dark:!text-gray-200",
    "dark:!bg-(--todo-completed-bg-dark) !text-gray-700 dark:!text-gray-200",
]

export const isCardOver: TaskState = {
    type: 'is-card-over',
}