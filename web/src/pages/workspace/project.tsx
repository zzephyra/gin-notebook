import AvatarMenu from "@/components/avatarMenu";
import { ChartBarIcon, ChevronUpDownIcon, EllipsisHorizontalIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { forwardRef, ReactNode, useEffect, useRef, useState } from "react";
// import { DragLocationHistory, DropTargetRecord } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';

import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from "@heroui/react";
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import invariant from 'tiny-invariant';
import {
    dropTargetForElements,
    monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
    attachClosestEdge,
    type Edge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { Task } from "@/components/todo/task";
import { ToDoColumn, TaskState } from "@/components/todo/type";
import { Tag } from "@douyinfe/semi-ui";
import "@/components/todo/style.css"
import { useMediaQuery } from "react-responsive";
import { useLingui } from "@lingui/react/macro";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProjectTodo } from "@/hooks/useTodoTask";
import ChaseLoading from "@/components/loading/Chase/loading";
import TodoContext, { useTodo } from "@/contexts/TodoContext";


export interface TodoListProps {
    columns: ToDoColumn[]
}

export interface TodoListRef {

}

const isCardOver: TaskState = {
    type: 'is-card-over',
}

const ToDoColumnClasses = [
    "bg-(--todo-pending-bg-light) dark:bg-(--todo-pending-bg-dark) text-gray-800 dark:text-gray-200",
    "bg-(--todo-processing-bg-light) dark:bg-(--todo-processing-bg-dark) text-gray-800 dark:text-gray-200",
    "bg-(--todo-completed-bg-light) dark:bg-(--todo-completed-bg-dark) text-gray-800 dark:text-gray-200",
]

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

const TodoList = forwardRef<TodoListRef, TodoListProps>((props, _) => {
    return (
        <>
            <div className="flex gap-4 overflow-y-auto w-full flex-1 p-2">
                {
                    props.columns.map((column) => (
                        <div className="max-h-full">
                            <Column key={column.id} column={column}>
                                {column.tasks.map((task) => (
                                    <Task task={task} />
                                    // <ToDoTask key={task.id} index={index} task={task} indicator={props.indicator} />
                                ))}
                            </Column>
                        </div>
                    ))
                }
            </div>
        </>
    )
});

function ProjectPage() {
    const { t } = useLingui();
    const [searchParams] = useSearchParams();
    const params = useParams();
    const navigate = useNavigate();

    const workspaceID = params.id || "";
    const projectID = searchParams.get("project_id") || "";
    const boardRef = useRef<HTMLDivElement | null>(null);
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const { columns, updateDraftTask, submitDraftTask, startDraftTask, projectList, currentProject, isLoading } = useProjectTodo(projectID, workspaceID)

    const providerValue = {
        columns,
        projectList,
        currentProject,
        isLoading,
        startDraftTask,
        updateDraftTask,
        submitDraftTask,
        // moveTask, updateTask, ...
    };
    useEffect(() => {
        const element = boardRef.current;
        invariant(element);
        return combine(
            monitorForElements({
                onDrop({ source, location }) {
                    console.log("onDrop", source, location);
                }
            }))
    }, [])

    function chooseProject(project_id: string) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('project_id', project_id); // 如果已存在会覆盖
        navigate(`${location.pathname}?${searchParams.toString()}`);
    }


    return (
        <>
            <TodoContext.Provider value={providerValue}>
                <div className="flex flex-col h-full w-full">
                    <div className="flex items-center px-2 py-1 justify-between ">
                        {/* 头部 */}
                        <div>
                            {!isDesktop && (
                                <AvatarMenu />
                            )}
                        </div>

                        <div>
                            <Button isIconOnly size="sm" variant="light" radius="full" >
                                <EllipsisHorizontalIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col max-w-full m-auto" ref={boardRef}>
                        {
                            isLoading ? (
                                <ChaseLoading text={t`Loading project...`}>
                                </ChaseLoading>
                            ) : (
                                <div className="flex items-center justify-between ">
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <div className="py-1 px-2 flex text-lg items-center gap-1" >
                                                <span>{currentProject && currentProject.name}</span>
                                                <ChevronUpDownIcon className="w-4 h-4" />
                                            </div>
                                        </DropdownTrigger>
                                        <DropdownMenu>
                                            {
                                                projectList.map((project: any) => (
                                                    <DropdownItem key={project.id} onClick={() => chooseProject(project.id)}>
                                                        {project.name}
                                                    </DropdownItem>
                                                ))
                                            }
                                        </DropdownMenu>
                                    </Dropdown>
                                    <div>
                                        <Button size="sm" color="primary">
                                            {t`Progress`}
                                            <ChartBarIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        }

                        <TodoList columns={columns} ></TodoList>
                    </div>
                </div>
            </TodoContext.Provider>
        </>
    )
}

export default ProjectPage;