// task.tsx
import {
    draggable,
    dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import invariant from "tiny-invariant";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { createPortal } from "react-dom";
import "@/components/todo/style.css";
import "./style.css";
import { Priority, TaksPayload, TaskState, ToDoColumn, TodoTask } from "../type";
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
    Drawer,
    DrawerContent,
    DrawerBody,
    useDisclosure,
    DrawerHeader,
    Divider,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Listbox,
    ListboxItem,
} from "@heroui/react";
import { Tag } from "@douyinfe/semi-ui";
import { i18n } from "@lingui/core";
import { useLingui } from "@lingui/react/macro";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { useParams } from "react-router-dom";
import { WorkspaceMember } from "@/types/workspace";
import { debounce } from "lodash";
import { FlagIcon } from "@heroicons/react/24/solid";
import { capitalizeWord } from "@/utils/tools";
import { useTodo } from "@/contexts/TodoContext";
import { ToDoColumnClasses } from "../column/script";
import { PriorityOptions } from "./script";
import MemberDropdown from "@/components/dropdown/member";
import BlockNoteEditor from "@/components/third-party/BlockNoteEditor";
import Comments from "@/components/comment/main";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { TaskCommentParams } from "@/features/api/type";
import { useTaskCommentsController } from "@/hooks/useComments";
import { CommentActionsProvider } from "@/contexts/CommentContext";
import { IconBackTop, IconClose } from "@douyinfe/semi-icons";
import { Calendar as DateCalendar, DateObject } from "react-multi-date-picker";
import dayjs from "dayjs";
import {
    attachClosestEdge,
    extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { getCardData, getCardDropTargetData, isCardData } from "../script";

const idle: TaskState = { type: "idle" };

const TagAttributesMap: Record<Priority, any> = {
    high: { type: "light", size: "small", color: "red" },
    medium: { type: "light", size: "small", color: "amber" },
    low: { type: "light", size: "small", color: "lime" },
};

const PriorityColorMap: Record<Priority, string> = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-red-500",
};

// 预览状态（与原 TaskState 分离，避免互相干扰）
type PreviewState =
    | { type: "idle" }
    | { type: "preview"; container: HTMLElement; rect: DOMRect };

function Task({ task, column }: { task: TodoTask; column: ToDoColumn }) {
    // wrapper 作为 drop target 容器
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const params = useParams();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [state, setState] = useState<TaskState>(idle);
    // 新增：拖拽预览状态
    const [preview, setPreview] = useState<PreviewState>({ type: "idle" });

    const { t } = useLingui();
    const [searchParams, setSearchParams] = useState({ limit: 10, keywords: "" });
    const { data: members, isFetching } = useWorkspaceMembers(params.id || "", searchParams);
    const titleRef = useRef<HTMLInputElement>(null);
    const composingRef = useRef(false);
    const [isEdit, setIsEdit] = useState({ title: false });
    const drawerBodyRef = useRef<HTMLDivElement | null>(null);
    const [showBackTop, setShowBackTop] = useState(false);
    const { submitTask, updateTask, activeOverlay, columns } = useTodo();
    // 被拖拽的实际元素（必须是 draggable 绑定的盒子）
    const taskRootRef = useRef<HTMLDivElement | null>(null);
    const assigneeRef = useRef<HTMLDivElement | null>(null);
    const priorityRef = useRef<HTMLDivElement | null>(null);
    const [openDeadlinePopover, setOpenDeadlinePopover] = useState(false);
    const [selectedAssigneeIDs, setSelectedAssigneeIDs] = useState<Set<string>>(
        new Set(task.assignee?.map((a) => a.id) || []),
    );
    const selectedRef = useRef(selectedAssigneeIDs);

    const currentUser: WorkspaceMember = useSelector((state: RootState) => {
        return {
            id: state.workspace.currentWorkspace?.member_id || "",
            workspace_nickname: state.workspace.currentWorkspace?.member_nickname,
            avatar: state.user.avatar,
            email: state.user.email,
            user_nickname: state.user.nickname || "",
            role: state.workspace.currentWorkspace?.roles || [],
        };
    });

    const [commentParams, setCommentParams] = useState<TaskCommentParams>({
        task_id: task.id,
        member_id: currentUser.id,
        workspace_id: params.id || "",
        limit: 10,
        offset: 0,
    });

    const commentsController = useTaskCommentsController(commentParams, { enabled: isOpen });
    useEffect(() => {
        selectedRef.current = selectedAssigneeIDs;
    }, [selectedAssigneeIDs]);

    useEffect(() => {
        setSelectedAssigneeIDs(new Set((task.assignee || []).map((a) => a.id)));
    }, [task.id]);

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
                    console.log(task.id == source.data.task.id)
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
        if (task.isEdit) return;
        onOpen();
    };

    const scrollDrawerToTop = useCallback(() => {
        const el = drawerBodyRef.current;
        if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        setShowBackTop(el.scrollTop > 100);
    }, []);

    useEffect(() => {
        const el = drawerBodyRef.current;
        if (!el) return;
        const onScroll = () => setShowBackTop(el.scrollTop > 100);
        el.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => el.removeEventListener("scroll", onScroll);
    }, [isOpen]);

    const switchEditStatus = (field: keyof typeof isEdit) => {
        setIsEdit((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    // const updateFilter = (filter: Partial<TaskCommentFilter>) => {
    //     setCommentParams((prev) => ({ ...prev, ...filter }));
    // };

    useEffect(() => {
        if (isEdit.title) (titleRef.current as any)?.focus?.();
    }, [isEdit.title]);

    const startEditTitle = () => {
        if (!isEdit.title) switchEditStatus("title");
    };

    const commitTitle = () => {
        const next = (titleRef.current as any)?.textContent?.trim?.() ?? "";
        if (next !== (task.title || "")) handleUpdateTask({ title: next } as any);
        if (isEdit.title) switchEditStatus("title");
    };

    const cancelTitle = () => {
        if (titleRef.current) (titleRef.current as any).textContent = task.title || "";
        if (isEdit.title) switchEditStatus("title");
    };

    const handleSelectDeadline = (date: DateObject | null) => {
        if (!date) return;
        const dt = date.toDate();
        dt.setHours(0, 0, 0, 0);
        handleUpdateTask({ deadline: dayjs(dt).format("YYYY-MM-DD") } as any);
        setOpenDeadlinePopover(false);
    };

    const onTitleKeyDown: React.KeyboardEventHandler<HTMLHeadingElement> = (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            (e as any).nativeEvent?.stopImmediatePropagation?.();
            cancelTitle();
            return;
        }
        if (e.key === "Enter" && !composingRef.current) {
            e.preventDefault();
            e.stopPropagation();
            (e as any).nativeEvent?.stopImmediatePropagation?.();
            commitTitle();
        }
    };

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

    const draggingClass = state.type === "is-dragging" ? "opacity-40" : "";

    return (
        <>
            <CommentActionsProvider value={commentsController}>
                {/* wrapper：作为 drop target 容器 */}
                <div
                    ref={wrapperRef}
                    data-task-id={task.id}
                    className={`relative w-3xs ${draggingClass} `}
                    onClick={handleClick}
                >
                    {/* inner：真正的 draggable 元素 */}
                    <Card ref={taskRootRef} className={`shadow-none background-white ${task.isEdit ? "" : "cursor-pointer"}`}>
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
                                </>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Drawer 保持不变 */}
                <Drawer
                    isOpen={isOpen}
                    hideCloseButton
                    isDismissable={!activeOverlay}
                    isKeyboardDismissDisabled={activeOverlay}
                    backdrop="transparent"
                    onOpenChange={onOpenChange}
                    size="md"
                    placement="right"
                >
                    <DrawerContent>
                        <DrawerHeader className="pb-0 px-2 flex justify-between items-center">
                            <div></div>
                            <div className="flex gap-1">
                                {showBackTop && (
                                    <Button radius="full" variant="light" size="sm" isIconOnly onPress={scrollDrawerToTop}>
                                        <IconBackTop className="text-gray-700" />
                                    </Button>
                                )}
                                <Button radius="full" variant="light" size="sm" isIconOnly onPress={onOpenChange}>
                                    <IconClose />
                                </Button>
                            </div>
                        </DrawerHeader>
                        <DrawerBody>
                            <div ref={drawerBodyRef} onScroll={handleBodyScroll} className="overflow-y-auto h-full px-2">
                                <div>
                                    <h1
                                        ref={titleRef as any}
                                        contentEditable={isEdit.title}
                                        suppressContentEditableWarning
                                        role="textbox"
                                        aria-multiline="false"
                                        onClick={startEditTitle}
                                        onBlur={commitTitle}
                                        onKeyDown={onTitleKeyDown}
                                        onCompositionStart={() => (composingRef.current = true)}
                                        onCompositionEnd={() => (composingRef.current = false)}
                                        className={`text-2xl px-2 pt-1 pb-2 rounded-xl font-bold ${isEdit.title ? "cursor-text" : "cursor-pointer hover:bg-gray-100"
                                            }`}
                                    >
                                        {task.title || t`New Task`}
                                    </h1>
                                </div>

                                <div className="flex">
                                    <div className="flex flex-1 items-center flex-col gap-1">
                                        <label className="font-bold text-sm">{t`Priority`}</label>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button size="sm" variant="light">
                                                    {task.priority ? (
                                                        <Tag size="small" {...TagAttributesMap[task.priority]}>
                                                            {i18n._(task.priority)}
                                                        </Tag>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">{t`No Priority`}</span>
                                                    )}
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu>
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

                                    <Divider className="bg-gray-200" orientation="vertical" />

                                    <div className="flex flex-1 items-center flex-col gap-1">
                                        <label className="font-bold text-sm">{t`Status`}</label>
                                        <Popover>
                                            <PopoverTrigger>
                                                <Button size="sm" variant="light">
                                                    <Tag size="large" shape="circle" className={`${ToDoColumnClasses[column.process_id]} !p-2`}>
                                                        {column.name}
                                                    </Tag>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <Listbox>
                                                    {columns.map((col) => (
                                                        <ListboxItem
                                                            key={col.id}
                                                            onClick={() => {
                                                                if (col.id !== column.id) handleUpdateTask({ column_id: col.id } as any);
                                                                setOpenDeadlinePopover(false);
                                                            }}
                                                        >
                                                            {col.name}
                                                        </ListboxItem>
                                                    ))}
                                                </Listbox>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <Divider className="bg-gray-200" orientation="vertical" />

                                    <div className="flex flex-1 items-center flex-col gap-1">
                                        <label className="font-bold text-sm">{t`Deadline`}</label>
                                        <Popover isOpen={openDeadlinePopover} onOpenChange={setOpenDeadlinePopover}>
                                            <PopoverTrigger>
                                                <Button size="sm" variant="light" className="text-gray-500">
                                                    {task.deadline ? new Date(task.deadline)?.toLocaleDateString() : t`No Deadline`}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <DateCalendar
                                                    onChange={handleSelectDeadline}
                                                    value={task.deadline ? new Date(task.deadline) : undefined}
                                                    shadow={false}
                                                    className="!border-none"
                                                    highlightToday={false}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-1 items-center">
                                        <label className="text-xs text-gray-500">{t`Assignee`}</label>
                                        <MemberDropdown
                                            members={members || []}
                                            isFetching={isFetching}
                                            onKeywordChange={onKeywordChange}
                                            selectedKeys={Array.from(selectedAssigneeIDs)}
                                            onAction={handleSelectAssignee}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <BlockNoteEditor
                                        options={{ placeholder: { emptyDocument: t`Write something about the task` } }}
                                        className="task-editor"
                                        noteID={task.id}
                                        content={task.description}
                                    />
                                </div>

                                <Divider className="my-2 bg-gray-200" />

                                <div>
                                    <Comments
                                        onFilterChange={(filter) => setCommentParams((prev) => ({ ...prev, ...filter }))}
                                        filter={commentParams}
                                        taskId={task.id}
                                        currentUser={currentUser}
                                    />
                                </div>
                            </div>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            </CommentActionsProvider>

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
