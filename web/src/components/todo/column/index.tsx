import { ReactNode, useEffect, useRef, useState } from "react";
import { TaskState, ToDoColumn } from "../type";
import { useTodo } from "@/contexts/TodoContext";
import invariant from 'tiny-invariant';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
    attachClosestEdge,
    type Edge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { Tag } from "@douyinfe/semi-ui";
import { Button } from "@heroui/button";
import { EllipsisHorizontalIcon, PlusIcon } from "@heroicons/react/24/outline";
import { isCardOver, ToDoColumnClasses } from "./script";

const Column = ({ children, column }: { children: ReactNode, column: ToDoColumn }) => {
    // const { isDropTarget, ref } = useDroppable({
    //     id: id,
    //     type: 'column',
    //     accept: ['item'],
    //     collisionPriority: CollisionPriority.Low,
    // });
    const idle = { type: 'idle' } as TaskState;
    const outerRef = useRef(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const [_, setState] = useState<TaskState>(idle);
    // const [isDraggedOver, setIsDraggedOver] = useState(false);
    const { startDraftTask } = useTodo();
    useEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        invariant(inner)
        invariant(outer);

        // function setIsCardOver({ data, location, self }: { data: any; location: DragLocationHistory, self: DropTargetRecord }) {
        //     const innerMost = location.current.dropTargets[0];
        //     console.log("setIsCardOver", data);

        //     const proposed: TaskState = {
        //         type: 'is-column-over',
        //         closestEdge: extractClosestEdge(self.data),
        //     };
        //     // optimization - don't update state if we don't need to.
        //     setState((current) => {
        //         if (isShallowEqual(proposed, current)) {
        //             return current;
        //         }
        //         return proposed;
        //     });
        // }

        return combine(
            dropTargetForElements({
                element: inner,
                getIsSticky: () => true,
                getData: () => column,
                canDrop: ({ source }) => {
                    // console.log("canDrop", source);
                    return source.data.type === 'item';
                },
                onDrag: () => {
                    console.log("innner onDrag", column);
                    setState(isCardOver)
                },
                onDragEnter: () => setState(isCardOver),
                onDragLeave: () => setState(idle),
                onDragStart: () => setState(isCardOver),
                onDrop: () => setState(idle),
            }),
            dropTargetForElements({
                element: outer,
                getIsSticky: () => true,

                getData({ input }) {
                    const data = column;
                    return attachClosestEdge(data, {
                        element: outer,
                        input,
                        allowedEdges: ['top', 'bottom'],
                    });
                },
                onDrag({ self, location }) {
                    const innerMost = location.current.dropTargets[location.current.dropTargets.length - 1];
                    // console.log("innerMost", innerRef.current?.contains(innerMost?.element), location.current);
                    if (innerRef.current?.contains(innerMost?.element)) {
                        setState(isCardOver)
                        return; // 阻止 outer 响应
                    }
                    setState((current) => {
                        const closestEdge: Edge | null = extractClosestEdge(self.data);
                        if (current.type === 'is-column-over' && current.closestEdge === closestEdge) {
                            return current;
                        }
                        return {
                            type: 'is-column-over',
                            closestEdge,
                        };
                    });
                },

                onDragLeave() {
                    setState(idle);
                },
                onDrop() {
                    setState(idle);
                },
            })
        );
    }, []);

    const handleCreate = () => {
        startDraftTask(column.id, { single: "submit" })
    }

    return (
        <>
            <div ref={outerRef} className="sticky rounded-b-none py-[15px] px-[20px] z-[25] min-w-[280px] top-0 items-center">
                <div className="flex items-center justify-between">
                    <Tag type="ghost" shape='circle' className="z-[130] text-base font-semibold">
                        {column.name}
                    </Tag>
                    <Button isIconOnly variant="light" size="sm" className="z-[130]  relative" >
                        <EllipsisHorizontalIcon className="w-4 h-4" />
                    </Button>
                </div>
                <div>
                    {/* column设置项 */}
                </div>
                <div className="absolute overflow-hidden inset-0 bg-white dark:bg-black z-[15]" />

                {/* 你设定的透明背景色 */}
                <div
                    className={`absolute overflow-hidden rounded-t-lg inset-0 z-[20] ${ToDoColumnClasses[column.process_id]}`}
                />
            </div >
            <div
                className={`${ToDoColumnClasses[column.process_id]} w-full z-[-3] rounded-b-lg pb-[15px] px-[20px] min-w-[280px] gap-2 flex flex-col`} ref={innerRef}>
                <div className="flex flex-col relative  gap-2 w-full ">
                    {children}
                </div>
                <Button onPress={handleCreate} size="sm" className="min-h-[32px] w-full" variant="light">
                    <PlusIcon className="h-5 text-gray-300 w-5" />
                </Button>
            </div>
        </>
    )
}

export default Column;