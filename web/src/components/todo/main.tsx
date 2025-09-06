import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { ToDoColumn, TodoTask } from "./type";
import { SideSheet } from "@douyinfe/semi-ui";
import { IconBackTop, IconClose, IconMaximize, IconMinimize } from "@douyinfe/semi-icons";
import Column from "./column";
import Task from "./task";
import { useTodo } from "@/contexts/TodoContext";
import { Button } from "@heroui/button";
import TaskDetails from "./taskDetails";

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
    const { activeOverlay } = useTodo();
    const column = props.columns.find(c => c.id === activeColumnID);
    const task = column?.tasks.find(t => t.id === activeTaskID);

    const handleClick = (task: TodoTask, column: ToDoColumn) => {
        setActiveTaskID(task.id);
        setActiveColumnID(column.id);
        setOpenSideSheet(true);
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

    useEffect(() => {
        const el = drawerBodyRef.current;
        if (!el) return;
        const onScroll = () => setShowBackTop(el.scrollTop > 100);
        el.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => el.removeEventListener("scroll", onScroll);
    }, [openSideSheet]);


    return (
        <>
            <div className="flex gap-4 overflow-y-auto w-full flex-1 p-2">
                {
                    props.columns.map((column) => (
                        <div key={column.id} className="max-h-full">
                            <Column key={column.id} column={column}>
                                {column.tasks.map((task) => (
                                    <Task key={task.id} column={column} onClick={handleClick} task={task} />
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
                    console.log("onCancel");
                    setOpenSideSheet(false);
                }}
                disableScroll={false}>
                {task && column && <TaskDetails task={task} column={column} onScroll={handleBodyScroll} showBrief={!isFullWidth} />
                }
            </SideSheet>
        </>
    )
});

export default TodoList;