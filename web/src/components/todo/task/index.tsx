// task.tsx
import {
    draggable,
    dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { Key, memo, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { createPortal } from "react-dom";
import "@/components/todo/style.css";
import "./style.css";
import { AnimatePresence, motion } from "framer-motion";
import { PriorityColorMap, TagAttributesMap, TaksPayload, TaskState, ToDoColumn, TodoTask } from "../type";
import {
    CardBody,
    Card,
    Avatar,
    Input,
    Dropdown,
    DropdownTrigger,
    Button,
    DropdownMenu,
    DropdownItem,
    ButtonGroup
} from "@heroui/react";
import { Tag } from "@douyinfe/semi-ui";
import { i18n } from "@lingui/core";
import { useLingui } from "@lingui/react/macro";
import { ChartBarIcon, EllipsisHorizontalIcon, PencilSquareIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useParams } from "react-router-dom";
import { debounce } from "lodash";
import { FlagIcon } from "@heroicons/react/24/solid";
import { capitalizeWord } from "@/utils/tools";
import { useTodo } from "@/contexts/TodoContext";
import { PriorityOptions } from "./script";
import MemberDropdown from "@/components/dropdown/member";

import {
    attachClosestEdge,
    extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { getCardData, getCardDropTargetData, isCardData } from "../script";
import { deleteProjectTaskRequest } from "@/features/api/project";

const idle: TaskState = { type: "idle" };
const avatarVariants = {
    initial: { opacity: 0, y: 12 },                  // 从底部“升上来”
    animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 500, damping: 30 } },
    exit: { opacity: 0, x: 12, transition: { duration: 0.18 } }, // 向右侧“滑走”
};
// 预览状态（与原 TaskState 分离，避免互相干扰）
type PreviewState =
    | { type: "idle" }
    | { type: "preview"; container: HTMLElement; rect: DOMRect };

function Task({ task, column, onClick, onUpload, onDelete }: { task: TodoTask; column: ToDoColumn, onClick?: (task: TodoTask, column: ToDoColumn) => void, onUpload?: (taskID: string, file: File) => void, onDelete?: (taskID: string, columnID: string) => void }) {
    // wrapper 作为 drop target 容器
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const coverRef = useRef<HTMLInputElement>(null);
    const params = useParams();
    const [state, setState] = useState<TaskState>(idle);
    // 新增：拖拽预览状态
    const [preview, setPreview] = useState<PreviewState>({ type: "idle" });

    const { t } = useLingui();
    const [searchParams, setSearchParams] = useState({ limit: 10, keywords: "" });
    const { data: members, isFetching } = useWorkspaceMembers(params.id || "", searchParams);

    const { submitTask, updateTask, onlineMap } = useTodo();
    // 被拖拽的实际元素（必须是 draggable 绑定的盒子）
    const taskRootRef = useRef<HTMLDivElement | null>(null);
    const assigneeRef = useRef<HTMLDivElement | null>(null);
    const priorityRef = useRef<HTMLDivElement | null>(null);
    const [selectedAssigneeIDs, setSelectedAssigneeIDs] = useState<Set<string>>(
        new Set(task.assignee?.map((a) => a.id) || []),
    );
    const selectedRef = useRef(selectedAssigneeIDs);

    useEffect(() => {
        selectedRef.current = selectedAssigneeIDs;
    }, [selectedAssigneeIDs]);

    useEffect(() => {
        setSelectedAssigneeIDs(new Set((task.assignee || []).map((a) => a.id)));
    }, [task.id]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                task.isEdit &&
                !(
                    taskRootRef.current?.contains(e.target as Node) ||
                    assigneeRef.current?.contains(e.target as Node) ||
                    priorityRef.current?.contains(e.target as Node)
                )
            ) {
                const addAssignees = Array.from(selectedRef.current);
                submitTask(task.id, { assignee_actions: { action_add: addAssignees } } as any);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [submitTask, task.isEdit]);

    // === 可拖可放 ===
    useEffect(() => {
        const outer = wrapperRef.current;
        const inner = taskRootRef.current;
        invariant(outer && inner);

        return combine(
            draggable({
                element: inner,
                getInitialData: ({ element }) =>
                    getCardData({
                        task,
                        columnId: column.id,
                        rect: element.getBoundingClientRect(),
                    }),
                onDragStart() {
                    setState({ type: "is-dragging" });
                },
                onGenerateDragPreview({ nativeSetDragImage, source }) {
                    const data = source.data;
                    invariant(isCardData(data));
                    const rect = inner.getBoundingClientRect();
                    setCustomNativeDragPreview({
                        nativeSetDragImage,
                        getOffset: () => ({ x: rect.width / 2, y: rect.height / 2 }),
                        render({ container }) {
                            // 关键：保存 container + 尺寸，随后用 portal 渲染
                            setPreview({ type: "preview", container, rect });
                        },
                    });
                },
                onDrop() {
                    setPreview({ type: "idle" }); // 清理预览
                    setState(idle);
                },
                // 如需更稳妥，也可加 onDragEnd: () => setPreview({ type: "idle" })
            }),
            dropTargetForElements({
                element: outer,
                getIsSticky: () => true,
                canDrop: ({ source }) => {
                    return isCardData(source.data)
                },
                getData: ({ element, input }) =>
                    attachClosestEdge(
                        getCardDropTargetData({ task, columnId: column.id }),
                        { element, input, allowedEdges: ["top", "bottom"] },
                    ),
                onDragEnter({ source, self }) {
                    if (!isCardData(source.data)) {
                        return;
                    }
                    if (source.data.task.id === task.id) {
                        return;
                    }
                    const closestEdge = extractClosestEdge(self.data);
                    if (!closestEdge) return;
                    setState({
                        type: "is-over",
                        dragging: source.data.rect as DOMRect,
                        closestEdge,
                    });
                },
                onDragLeave({ source }) {
                    if (!isCardData(source.data)) {
                        return;
                    }
                    if (source.data.task.id === task.id) {
                        setState({ type: 'is-dragging' });
                        return;
                    }
                    setState(idle);
                },
                onDrop() {
                    setState(idle);
                },
            }),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task.id]);

    const onKeywordChange = debounce((value: string) => {
        setSearchParams((prev) => ({ ...prev, keywords: value }));
    }, 500);

    const handleUpdateTask = (payload: TaksPayload) => {
        updateTask(task.id, payload);
    };

    const handleSelectAssignee = (keys: any) => {
        setSelectedAssigneeIDs((prev) => {
            const next = new Set(prev);
            if (next.has(keys)) {
                next.delete(keys);
                updateTask(task.id, { assignee_actions: { action_remove: [keys] } } as any);
            } else {
                next.add(keys);
                updateTask(task.id, { assignee_actions: { action_add: [keys] } } as any);
            }
            return next;
        });
    };

    const handleClick = () => {
        onClick?.(task, column);
    }

    const handlerUploadCover = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (!onUpload) return;
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        onUpload(task.id, files[0]);
        e.target.value = "";
    }


    const dropdownAction = async (key: Key) => {
        if (key === "upload_cover") {
            const el = coverRef.current;
            if (!el) return;
            el.dispatchEvent(new MouseEvent("click", { bubbles: false, cancelable: true }));
        } else if (key === "delete_task") {
            if (!onDelete) return;
            onDelete(task.id, column.id);
        }
    }
    const hasOnline = !!onlineMap?.[task.id]?.length;

    const draggingClass = state.type === "is-dragging" ? "opacity-40" : "";
    return (
        <>
            {/* wrapper：作为 drop target 容器 */}
            <div
                ref={wrapperRef}
                data-task-id={task.id}
                className={`relative w-full px-[20px]  ${draggingClass} `}
                onClick={handleClick}
            >
                {/* inner：真正的 draggable 元素 */}
                <Card ref={taskRootRef} className={`overflow-visible group/card shadow-none background-white ${task.isEdit ? "" : "cursor-pointer"} `}>
                    <CardBody>
                        {task.isEdit ? (
                            <div className="flex flex-col gap-2">
                                <Input
                                    size="sm"
                                    classNames={{ input: "text-xs" }}
                                    defaultValue={task.title || ""}
                                    onValueChange={(value) => handleUpdateTask({ title: value } as any)}
                                    placeholder={t`New Project`}
                                />
                                <div className="flex gap-1 items-center">
                                    <MemberDropdown
                                        members={members || []}
                                        menuRef={assigneeRef}
                                        isFetching={isFetching}
                                        onKeywordChange={onKeywordChange}
                                        selectedKeys={Array.from(selectedAssigneeIDs)}
                                        onAction={handleSelectAssignee}
                                        ref={assigneeRef as any}
                                    />
                                </div>
                                <Dropdown backdrop="blur">
                                    <DropdownTrigger>
                                        <Button size="sm" variant="light" className="w-full justify-start gap-1">
                                            {task.priority ? (
                                                <div className="flex gap-1 items-center">
                                                    <FlagIcon className={`w-4 h-4 ${PriorityColorMap[task.priority]}`} />
                                                    <span className="text-xs text-gray-500 truncate">
                                                        {i18n._(capitalizeWord(task.priority))}
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    <ChartBarIcon className="rotate-90 w-4 h-4 text-gray-400" />
                                                    <span className="text-xs text-gray-500 truncate">{t`Select Priority`}</span>
                                                </>
                                            )}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu ref={priorityRef as any}>
                                        {PriorityOptions.map((option) => (
                                            <DropdownItem
                                                key={option.value}
                                                onPress={() => handleUpdateTask({ priority: option.value } as any)}
                                            >
                                                <div className="flex gap-2 items-center">
                                                    <FlagIcon className={`w-4 h-4 ${PriorityColorMap[option.value]}`} />
                                                    <span className="text-xs text-gray-500 truncate">{t`${option.label}`}</span>
                                                </div>
                                            </DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                        ) : (
                            <>
                                <div className="text-sm text-gray-500 mb-2">{task.title || t`New Task`}</div>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-end">
                                        {task.assignee &&
                                            task.assignee.map((assignee) => (
                                                <Avatar
                                                    key={assignee.id}
                                                    src={assignee.avatar}
                                                    alt={assignee.avatar}
                                                    className="w-6 h-6 text-tiny"
                                                />
                                            ))}
                                    </div>
                                    {task.priority && (
                                        <Tag size="small" {...TagAttributesMap[task.priority]}>
                                            {i18n._(task.priority)}
                                        </Tag>
                                    )}
                                </div>
                                <div className="opacity-0 group-hover/card:opacity-100 absolute top-1 right-1 z-[100]">
                                    <ButtonGroup variant="light" className="shadow-xs rounded-md">
                                        <Button className="h-[24px] text-gray-400 w-[26px] min-w-0" radius="sm" isIconOnly>
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </Button>
                                        <Dropdown shouldCloseOnBlur portalContainer={taskRootRef.current || document.body}>
                                            <DropdownTrigger>
                                                <Button className="h-[24px] text-gray-400 w-[26px] min-w-0" radius="sm" isIconOnly>
                                                    <EllipsisHorizontalIcon className="w-4 h-4" />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu onAction={dropdownAction} className="group/card" >
                                                <DropdownItem key="upload_cover" startContent={<PhotoIcon className="w-4 h-4" />}>
                                                    {task.cover ? t`Change Cover` : t`Add Cover`}
                                                </DropdownItem>
                                                <DropdownItem key="delete_task" color="danger" startContent={<TrashIcon className="w-4 h-4" />}>
                                                    {t`Delete`}
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                        <input type="file" accept="image/*" className="hidden" ref={coverRef} onChange={handlerUploadCover} />
                                    </ButtonGroup>
                                </div>
                            </>
                        )}

                    </CardBody>
                </Card>

                {/* 协同工作：显示正在操作用户的头像 */}
                <div className="absolute right-0 top-0">
                    <motion.div
                        layout
                        className="flex flex-col-reverse items-end gap-1" // 底部对齐、从下往上堆
                        transition={{ layout: { duration: 0.18 } }}
                    >
                        <AnimatePresence initial={false}>
                            {hasOnline &&
                                onlineMap[task.id].map((u) => (
                                    <motion.div
                                        key={u.user_id}
                                        layout
                                        variants={avatarVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                    >
                                        <Avatar
                                            src={u.avatar}
                                            alt={u.name}
                                            className="w-5 h-5 border-2 border-white"
                                        />
                                    </motion.div>
                                ))}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>



            {/* === 自定义原生拖拽预览：使用 Portal 渲染到 container === */}
            {preview.type === "preview" &&
                createPortal(
                    <div
                        style={{
                            position: "fixed",
                            left: 0,
                            top: 0,
                            width: 0,
                            height: 0,
                            pointerEvents: "none",
                            zIndex: 2147483647,
                        }}
                    >
                        <div
                            style={{
                                position: "fixed",
                                left: preview.rect.left,
                                top: preview.rect.top,
                                width: preview.rect.width,
                                height: preview.rect.height,
                                padding: 12,
                                borderRadius: 12,
                                background: "#fff",
                                border: "1px solid rgba(0,0,0,.1)",
                                boxShadow: "0 8px 24px rgba(0,0,0,.15)",
                            }}
                        >
                            {/* 这里渲染希望拖拽时看到的“幽灵卡片”UI，可按需丰富 */}
                            <div className="text-sm text-gray-600">{task.title || t`New Task`}</div>
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex gap-2">
                                    {task.assignee?.map((a) => (
                                        <Avatar key={a.id} src={a.avatar} className="w-5 h-5" />
                                    ))}
                                </div>
                                {task.priority && (
                                    <Tag size="small" {...TagAttributesMap[task.priority]}>
                                        {i18n._(task.priority)}
                                    </Tag>
                                )}
                            </div>
                        </div>
                    </div>,
                    preview.container,
                )}
        </>
    );
}

export default memo(Task);
