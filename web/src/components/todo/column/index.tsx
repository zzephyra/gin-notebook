// column.tsx
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { TaskState, ToDoColumn } from "../type";
import { useTodo } from "@/contexts/TodoContext";
import invariant from "tiny-invariant";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Tag } from "@douyinfe/semi-ui";
import { Button } from "@heroui/button";
import { EllipsisHorizontalIcon, PlusIcon } from "@heroicons/react/24/outline";
import { isCardOver, ToDoColumnClasses } from "./script";
import { isCardData } from "../script";

/** 指示条：插在两个 task 之间 */
function GapIndicator() {
    return (
        <div className="relative my-1">
            <div className="h-0.5 w-full bg-blue-300 rounded-full" />
        </div>
    );
}

const Column = ({ children, column }: { children: ReactNode; column: ToDoColumn }) => {
    const idle = { type: "idle" } as TaskState;
    const outerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);

    const [_, setState] = useState<TaskState>(idle);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const { startDraftTask, updateTask } = useTodo();

    // 以数组形式操作 children，方便插入指示条
    const childArray = useMemo(() => React.Children.toArray(children), [children]);

    // 计算某个 Y 坐标应插入到哪一个 gap（0..N）
    const computeDropIndex = (clientY: number): number => {
        const container = innerRef.current;
        if (!container) return 0;

        // 只拿带 data-task-id 的元素（Task 的 wrapper）
        const nodes = Array.from(
            container.querySelectorAll<HTMLElement>("[data-task-id]")
        ).filter((el) => el.offsetParent !== null); // 可见

        if (nodes.length === 0) return 0;

        // 遍历每个 task 的中线，鼠标在它上方则插到它前面
        for (let i = 0; i < nodes.length; i++) {
            const rect = nodes[i].getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (clientY <= mid) {
                return i; // 插到第 i 个 task 之前
            }
        }
        // 否则插到末尾
        return nodes.length;
    };

    // 根据 dropIndex 计算 before/after_task_id，并调用 updateTask
    const commitInsert = (sourceTaskId: string, index: number) => {
        const container = innerRef.current;
        if (!container) return;

        const nodes = Array.from(
            container.querySelectorAll<HTMLElement>("[data-task-id]")
        );
        const ids = nodes.map((n) => n.dataset.taskId!).filter(Boolean);

        // 空列
        if (ids.length === 0) {
            updateTask(sourceTaskId, { column_id: column.id } as any);
            return;
        }

        // index == 0 => 插到第一个前面
        if (index <= 0) {
            updateTask(sourceTaskId, { column_id: column.id, before_task_id: ids[0] } as any);
            return;
        }

        // index == ids.length => 插到最后一个后面
        if (index >= ids.length) {
            updateTask(sourceTaskId, {
                column_id: column.id,
                after_task_id: ids[ids.length - 1],
            } as any);
            return;
        }

        // 中间：插到 ids[index] 前面
        updateTask(sourceTaskId, { column_id: column.id, before_task_id: ids[index] } as any);
    };

    useEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        invariant(inner);
        invariant(outer);

        return combine(
            // 让“列表区域”成为唯一的 drop target：
            // 1) onDrag 中根据鼠标 Y 计算应插入的 gap，实时渲染指示条
            // 2) onDrop 根据 gap 计算 before/after_task_id 提交
            dropTargetForElements({
                element: outer,
                getIsSticky: () => true,
                getData: () => column,
                canDrop({ source }) {
                    return isCardData(source.data);
                },

                onDrag: ({ location }) => {
                    setState(isCardOver);
                    const y = location.current.input.clientY;
                    const idx = computeDropIndex(y);
                    setDropIndex(idx);
                },
                onDragEnter: ({ location }) => {
                    setState(isCardOver);
                    const y = location.current.input.clientY;
                    const idx = computeDropIndex(y);
                    setDropIndex(idx);
                },
                onDragLeave: () => {
                    setState(idle);
                    setDropIndex(null);
                },
                onDragStart: ({ location }) => {
                    setState(isCardOver);
                    const y = location.current.input.clientY;
                    const idx = computeDropIndex(y);
                    setDropIndex(idx);
                },
                onDrop: ({ source, location }) => {
                    setState(idle);

                    if (source?.data?.type !== "item") {
                        setDropIndex(null);
                        return;
                    }
                    // 确保使用最终落点的 index
                    const y = location.current.input.clientY;
                    const idx = computeDropIndex(y);

                    commitInsert(source.data.id as string, idx);
                    setDropIndex(null);
                },
            })
        );
    }, [column.id, updateTask]);

    const handleCreate = () => {
        startDraftTask(column.id, { single: "submit" });
    };

    // 把指示条插到 childArray 的第 dropIndex 个位置（0..N）
    const childrenWithIndicator = useMemo(() => {
        if (dropIndex == null) return childArray;
        const cloned = [...childArray];
        // 指示条是独立节点，不影响 data-task-id 选择
        cloned.splice(dropIndex, 0, <GapIndicator key="__gap-indicator__" />);
        return cloned;
    }, [childArray, dropIndex]);

    return (
        <>
            <div ref={outerRef}>
                <div

                    className="sticky rounded-b-none py-[15px] px-[20px] z-[25] min-w-[280px] top-0 items-center"
                >
                    <div className="flex items-center justify-between">
                        <Tag type="ghost" shape="circle" className="z-[130] text-base font-semibold">
                            {column.name}
                        </Tag>
                        <Button isIconOnly variant="light" size="sm" className="z-[130] relative">
                            <EllipsisHorizontalIcon className="w-4 h-4" />
                        </Button>
                    </div>
                    <div>{/* column设置项 */}</div>
                    <div className="absolute overflow-hidden inset-0 bg-white dark:bg-black z-[15]" />
                    <div
                        className={`absolute overflow-hidden rounded-t-lg inset-0 z-[20] ${ToDoColumnClasses[column.process_id]}`}
                    />
                </div>

                {/* 列体（列表区域是唯一 drop target） */}
                <div
                    className={`${ToDoColumnClasses[column.process_id]} w-full z-[-3] rounded-b-lg pb-[15px] px-[20px] min-w-[280px] gap-2 flex flex-col`}
                >
                    <div ref={innerRef} className="flex flex-col relative gap-2 w-full">
                        {childrenWithIndicator}
                    </div>

                    <Button onPress={handleCreate} size="sm" className="min-h-[32px] w-full" variant="light">
                        <PlusIcon className="h-5 text-gray-300 w-5" />
                    </Button>
                </div>
            </div>
        </>
    );
};

export default Column;
