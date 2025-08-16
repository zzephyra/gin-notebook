import { TodoPriorityOption, TodoTask } from "../type"

export const isTaskData = (data: any): data is TodoTask => {
    return data.type == "item"
}

export function isShallowEqual(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>,
): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }
    return keys1.every((key1) => Object.is(obj1[key1], obj2[key1]));
}

export const PriorityOptions: TodoPriorityOption[] = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
];