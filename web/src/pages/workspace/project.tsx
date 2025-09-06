import AvatarMenu from "@/components/avatarMenu";
import { ChartBarIcon, ChevronUpDownIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { useEffect, useRef } from "react";
// import { DragLocationHistory, DropTargetRecord } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';

import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from "@heroui/react";
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import invariant from 'tiny-invariant';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import {
    monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { ToDoColumn } from "@/components/todo/type";
import "@/components/todo/style.css"
import { useMediaQuery } from "react-responsive";
import { useLingui } from "@lingui/react/macro";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProjectTodo } from "@/hooks/useTodoTask";
import ChaseLoading from "@/components/loading/Chase/loading";
import TodoContext from "@/contexts/TodoContext";
import { isCardData, isCardDropTargetData } from "@/components/todo/script";
import TodoList from "@/components/todo/main";

function ProjectPage() {
    const { t } = useLingui();
    const [searchParams] = useSearchParams();
    const params = useParams();
    const navigate = useNavigate();
    const workspaceID = params.id || "";
    const projectID = searchParams.get("project_id") || "";
    const boardRef = useRef<HTMLDivElement | null>(null);
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const { columns, activeOverlay, updateColumn, cleanColumnTasks, setActiveOverlay, updateTask, submitTask, startDraftTask, projectList, currentProject, isLoading } = useProjectTodo(projectID, workspaceID)

    const providerValue = {
        columns,
        projectList,
        currentProject,
        isLoading,
        activeOverlay,
        setActiveOverlay,
        startDraftTask,
        updateTask,
        submitTask,
        cleanColumnTasks,
        updateColumn,
        // moveTask, updateTask, ...
    };
    useEffect(() => {
        const element = boardRef.current;
        invariant(element);
        return combine(
            monitorForElements({
                canMonitor: ({ source }) => isCardData(source.data),
                onDrop({ source, location }) {
                    const dragging = source.data;
                    if (!isCardData(dragging)) {
                        return;
                    }
                    const innerMost = location.current.dropTargets[0];
                    if (!innerMost) {
                        return;
                    }
                    const dropTargetData = innerMost.data;
                    const homeColumnIndex = columns.findIndex(
                        (column) => column.id === dragging.columnId,
                    );
                    const home: ToDoColumn | undefined = columns[homeColumnIndex];

                    if (!home) {
                        return;
                    }
                    const cardIndexInHome = home.tasks.findIndex((task) => task.id === dragging.task.id);
                    if (isCardDropTargetData(dropTargetData)) {
                        const destinationColumnIndex = columns.findIndex(
                            (column) => column.id === dropTargetData.columnId,
                        );
                        const destination = columns[destinationColumnIndex];
                        var isBlow = 0; // 如果目标任务和源任务在同一列，且源任务在目标任务前面，则插入时索引要-1
                        if (home === destination) {
                            const cardFinishIndex = home.tasks.findIndex(
                                (task) => task.id === dropTargetData.task.id,
                            );
                            if (cardIndexInHome === -1 || cardFinishIndex === -1) {
                                return;
                            }

                            if (cardIndexInHome === cardFinishIndex) {
                                return;
                            }
                            isBlow = cardIndexInHome < cardFinishIndex ? 1 : 0;
                        }

                        if (!destination) {
                            return;
                        }
                        const indexOfTarget = destination.tasks.findIndex(
                            (task) => task.id === dropTargetData.task.id,
                        );

                        const closestEdge = extractClosestEdge(dropTargetData);
                        if (closestEdge == "top") {
                            if (indexOfTarget == 0) {
                                // 插到第一个前面
                                updateTask(dragging.task.id, { column_id: destination.id, before_id: destination.tasks[0].id } as any, { insertIndex: indexOfTarget - isBlow });
                            } else {
                                updateTask(dragging.task.id, { column_id: destination.id, before_id: destination.tasks[indexOfTarget].id, after_id: destination.tasks[indexOfTarget - 1].id } as any, { insertIndex: indexOfTarget - isBlow });
                            }
                        } else if (closestEdge == "bottom") {
                            if (indexOfTarget == destination.tasks.length - 1) {
                                // 插到最后一个后面
                                updateTask(dragging.task.id, { column_id: destination.id, after_id: destination.tasks[destination.tasks.length - 1].id } as any, { insertIndex: indexOfTarget + 1 - isBlow });
                            } else {
                                updateTask(dragging.task.id, { column_id: destination.id, before_id: destination.tasks[indexOfTarget + 1].id, after_id: destination.tasks[indexOfTarget].id } as any, { insertIndex: indexOfTarget + 1 - isBlow });
                            }
                        } else {

                            return
                        }
                    }

                }
            }))
    }, [columns])

    function chooseProject(project_id: string) {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('project_id', project_id); // 如果已存在会覆盖
        navigate(`${location.pathname}?${searchParams.toString()}`);
    }

    return (
        <>
            <TodoContext.Provider value={providerValue}>
                <div className="project-cls flex flex-col h-full w-full">
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
                    <div className="flex-1 flex flex-col max-w-full m-auto overflow-auto" ref={boardRef}>
                        {
                            isLoading ? (
                                <ChaseLoading text={t`Loading project...`}>
                                </ChaseLoading>
                            ) : (
                                <div className="flex items-center justify-between ">
                                    <Dropdown>
                                        <DropdownTrigger >
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

                        <TodoList columns={columns}></TodoList>
                    </div>
                </div>
            </TodoContext.Provider>
        </>
    )
}

export default ProjectPage;