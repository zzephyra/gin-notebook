import AvatarMenu from "@/components/avatarMenu";
import { ChartBarIcon, ChevronUpDownIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { forwardRef, useEffect, useRef } from "react";
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
    monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import Task from "@/components/todo/task";
import { ToDoColumn } from "@/components/todo/type";
import "@/components/todo/style.css"
import { useMediaQuery } from "react-responsive";
import { useLingui } from "@lingui/react/macro";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProjectTodo } from "@/hooks/useTodoTask";
import ChaseLoading from "@/components/loading/Chase/loading";
import TodoContext from "@/contexts/TodoContext";
import Column from "@/components/todo/column";


export interface TodoListProps {
    columns: ToDoColumn[]
}

export interface TodoListRef {

}

const TodoList = forwardRef<TodoListRef, TodoListProps>((props, _) => {
    return (
        <>
            <div className="flex gap-4 overflow-y-auto w-full flex-1 p-2">
                {
                    props.columns.map((column) => (
                        <div key={column.id} className="max-h-full">
                            <Column key={column.id} column={column}>
                                {column.tasks.map((task) => (
                                    <Task key={task.id} column={column} task={task} />
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
    const { columns, activeOverlay, setActiveOverlay, updateDraftTask, submitDraftTask, startDraftTask, projectList, currentProject, isLoading } = useProjectTodo(projectID, workspaceID)

    const providerValue = {
        columns,
        projectList,
        currentProject,
        isLoading,
        activeOverlay,
        setActiveOverlay,
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