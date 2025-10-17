import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { TaksPayload, ToDoColumn, TodoTask } from "./type";
import { SideSheet } from "@douyinfe/semi-ui";
import { IconBackTop, IconClose, IconMaximize, IconMinimize } from "@douyinfe/semi-icons";
import Column from "./column";
import Task from "./task";
import { useTodo } from "@/contexts/TodoContext";
import { Button } from "@heroui/button";
import TaskDetails from "./taskDetails";
import { UploadFile } from "@/lib/upload";
import toast from "react-hot-toast";
import { useLingui } from "@lingui/react/macro";
import { deleteProjectTaskRequest } from "@/features/api/project";
import { useParams } from "react-router-dom";
import { responseCode } from "@/features/constant/response";

export interface TodoListProps {
    columns: ToDoColumn[]
}

export interface TodoListRef {

}

const TodoList = forwardRef<TodoListRef, TodoListProps>((props, _) => {
    const [openSideSheet, setOpenSideSheet] = useState(false);
    const [isFullWidth, setIsFullWidth] = useState(false);
    const [activeTaskID, setActiveTaskID] = useState<string>();
    const [activeColumnID, setActiveColumnID] = useState<string>();
    const [showBackTop, setShowBackTop] = useState(false);
    const drawerBodyRef = useRef<HTMLDivElement | null>(null);
    const { activeOverlay, updateTask, focusTask, blurTask, deleteTask } = useTodo();
    const column = props.columns.find(c => c.id === activeColumnID);
    const task = column?.tasks.find(t => t.id === activeTaskID);
    const { t } = useLingui();
    const params = useParams();

    const handleClick = (newTask: TodoTask, column: ToDoColumn) => {
        if (task) {
            blurTask && blurTask(task.id);
        }

        if (newTask.isEdit) return;
        setActiveTaskID(newTask.id);
        setActiveColumnID(column.id);
        setOpenSideSheet(true);
        focusTask && focusTask(newTask.id);
    };

    const scrollDrawerToTop = useCallback(() => {
        const el = drawerBodyRef.current;
        if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    }, []);
    const handleBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        setShowBackTop(el.scrollTop > 100);
    }, []);

    const getContainer = () => {
        return document.querySelector('.project-cls') as HTMLElement || document.body;
    };
    const handleChange = (taskID: string, columnID: string) => {
        setActiveTaskID(taskID);
        setActiveColumnID(columnID);
    }

    const handleUploadCover = async (taskID: string, file: File) => {
        if (!taskID) return;
        const controller = UploadFile({ file: file });
        const off = controller.on((event) => {
            if (event.type === "error") {
                toast.error(t`Upload failed`);
                off();
            }
        });

        const { url } = await controller.promise;
        updateTask(taskID, { cover: url } as any);
    }

    const handleDeleteTask = async (taskID: string, columnID: string) => {
        let res = await deleteProjectTaskRequest(taskID, params.id || "")
        if (res.code != responseCode.SUCCESS) {
            toast.error(t`Delete task failed`);
        } else {
            deleteTask(taskID, columnID);
        }
    }

    const handleUpdateTask = (taskID: string, payload: Partial<TaksPayload>) => {
        updateTask(taskID, payload);
    }

    useEffect(() => {
        if (!openSideSheet && task) {
            if (task) {
                blurTask && blurTask(task.id);
            }
            setActiveTaskID(undefined);
            setActiveColumnID(undefined);
        }
    }, [openSideSheet, task]);


    return (
        <>
            <div className="flex gap-4 overflow-y-auto w-full flex-1 px-2 pb-2 mt-2">
                {
                    props.columns.map((column) => (
                        <div key={column.id} className="h-full">
                            <Column key={column.id} column={column}>
                                {column.tasks.map((task) => (
                                    <Task onUpdate={handleUpdateTask} classNames={{ wrapper: "px-[20px]" }} key={task.id} column={column} onClick={handleClick} onDelete={handleDeleteTask} task={task} onUpload={handleUploadCover} />
                                ))}
                            </Column>
                        </div>
                    ))
                }
            </div>
            <SideSheet
                visible={openSideSheet}
                width={isFullWidth ? getContainer().clientWidth : 520}
                closable={false}
                closeOnEsc={!activeOverlay}
                headerStyle={{ paddingBottom: 0 }}
                className={`!transition-all ${isFullWidth ? "!shadow-none task-sidesheet" : ""}`}
                title={
                    <div className="pb-0 px-2 flex justify-between items-center">
                        <div></div>
                        <div className="flex gap-1">
                            {showBackTop && (
                                <Button radius="full" variant="light" size="sm" isIconOnly onPress={scrollDrawerToTop}>
                                    <IconBackTop className="text-gray-700" />
                                </Button>
                            )}
                            <Button radius="full" variant="light" size="sm" isIconOnly onPress={() => setIsFullWidth((v) => !v)}>
                                {
                                    isFullWidth ? <IconMinimize className="text-gray-700" /> : <IconMaximize className="text-gray-700 rotate-90" />
                                }
                            </Button>
                            <Button radius="full" variant="light" size="sm" isIconOnly onPress={() => openSideSheet && setOpenSideSheet(false)}>
                                <IconClose />
                            </Button>
                        </div>
                    </div>
                }
                mask={false}
                onCancel={() => {
                    setOpenSideSheet(false);
                }}
                disableScroll={false}>
                {task && column && <TaskDetails onUpload={handleUploadCover} onChange={handleChange} task={task} column={column} onScroll={handleBodyScroll} showBrief={!isFullWidth} />
                }
            </SideSheet>
        </>
    )
});

export default TodoList;