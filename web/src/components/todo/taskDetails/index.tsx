import { useEffect, useRef, useState } from "react";
import { PriorityColorMap, TagAttributesMap, TaksPayload, ToDoColumn, TodoTask } from "../type";
import { useTodo } from "@/contexts/TodoContext";
import { TaskCommentParams } from "@/features/api/type";
import { WorkspaceMember } from "@/types/workspace";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useParams } from "react-router-dom";
import { Calendar as DateCalendar, DateObject } from "react-multi-date-picker";
import BlockNoteEditor from "@/components/third-party/BlockNoteEditor";
import { FlagIcon } from "@heroicons/react/24/solid";
import Comments from "@/components/comment/main";
import {
    Dropdown,
    DropdownTrigger,
    Button,
    DropdownMenu,
    DropdownItem,
    Divider,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Listbox,
    Image,
    ListboxItem,
    ButtonGroup,
    Tabs,
    Tab,
} from "@heroui/react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import dayjs from "dayjs";
import { i18n } from "@lingui/core";
import { Tag } from "@douyinfe/semi-ui";
import { PriorityOptions } from "../task/script";
import MemberDropdown from "@/components/dropdown/member";
import { useLingui } from "@lingui/react/macro";
import { useTaskCommentsController } from "@/hooks/useComments";
import { CommentActionsProvider } from "@/contexts/CommentContext";
import { ToDoColumnClasses } from "../column/script";
import { useWorkspaceMembers } from "@/hooks/useWorkspaceMembers";
import { debounce } from "lodash";
import { IconDelete, IconPlus, IconUpload } from '@douyinfe/semi-icons';
import useTaskActivity from "@/hooks/useActivity";
import TaskActivity from "../activity";


const TaskDetails = ({ task, column, onScroll, showBrief, onChange, onUpload }: { task: TodoTask, column: ToDoColumn, onScroll?: (e: React.UIEvent<HTMLDivElement>) => void, showBrief?: boolean, onChange?: (taskID: string, columnID: string) => void, onUpload: (taskID: string, file: File) => void }) => {
    const drawerBodyRef = useRef<HTMLDivElement | null>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);
    const [isEdit, setIsEdit] = useState({ title: false });
    const params = useParams();
    const { updateTask, setActiveOverlay, columns } = useTodo();
    const [searchParams, setSearchParams] = useState({ limit: 10, keywords: "" });

    const { data: members, isFetching } = useWorkspaceMembers(params.id || "", searchParams);
    const { activities } = useTaskActivity(task.id, params.id || "");
    const [selectedAssigneeIDs, setSelectedAssigneeIDs] = useState<Set<string>>(
        new Set(task.assignee?.map((a) => a.id) || []),
    );
    const { t } = useLingui();
    const composingRef = useRef(false);
    const [openDeadlinePopover, setOpenDeadlinePopover] = useState(false);
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

    const commentsController = useTaskCommentsController(commentParams, {});


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


    const handleUploadCover = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!onUpload) return;
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        onUpload(task.id, files[0]);
        e.target.value = "";
    }

    const handleUpdateTask = (payload: TaksPayload) => {
        updateTask(task.id, payload);
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

    const onKeywordChange = debounce((value: string) => {
        setSearchParams((prev) => ({ ...prev, keywords: value }));
    }, 500);

    return (
        <CommentActionsProvider value={commentsController}>
            <div ref={drawerBodyRef} onScroll={onScroll} className={`overflow-y-auto h-full px-2 flex flex-col `}>
                <div className="mb-2 transition-[height] ease-in-out duration-300">
                    {
                        task.cover ? (
                            <div className="relative group">
                                <PhotoProvider onVisibleChange={(open) => setActiveOverlay?.(open)}>
                                    <PhotoView src={task.cover}>
                                        <Image removeWrapper className="w-full max-h-[200px] object-cover object-center" loading="lazy" src={task.cover}>
                                        </Image>
                                    </PhotoView>
                                </PhotoProvider>
                                <ButtonGroup className="absolute  bottom-2 right-2">
                                    <Button radius="sm" onPress={() => coverRef.current?.click()} className="group-hover:opacity-100 opacity-0 px-[6px] !h-[26px] w-auto gap-[2px] z-[1000] shadow-sm  min-w-0 min-h-0 text-xs !bg-white hover:!bg-gray-100 hover:!opacity-100">
                                        <IconUpload />
                                        {t`Change Cover`}
                                    </Button>
                                    <Button radius="sm" onPress={() => handleUpdateTask({ cover: null } as any)} className="group-hover:opacity-100 opacity-0 px-[6px] !h-[26px] w-auto gap-[2px] z-[1000] shadow-sm  min-w-0 min-h-0 text-xs !bg-white hover:!bg-gray-100 hover:!opacity-100">
                                        <IconDelete />
                                        {t`Remove`}
                                    </Button>
                                </ButtonGroup>
                            </div>
                        ) : (
                            <div className="group">
                                <Button variant="light" onPress={() => coverRef.current?.click()} radius="sm" className="group-hover:opacity-100 bg-gray-100 opacity-0 text-xs text-gray-400 px-[6px] !h-[26px] w-auto gap-[2px]">
                                    <IconPlus size="small" />
                                    {t`Add Cover`}
                                </Button>
                            </div>
                        )
                    }
                    <input className="hidden" onChange={handleUploadCover} accept="image/*" ref={coverRef} type="file" />
                </div>
                <div className={`${showBrief ? "" : "flex gap-2 flex-1 overflow-hidden"}`}>
                    <div className="flex-1">
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
                        <div className="grid gap-3">
                            {showBrief ? (
                                <>
                                    {/* 第一行三列：Priority / Status / Deadline */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* Priority */}
                                        <div className={`flex flex-1 items-center ${showBrief ? "flex-col" : ""} gap-1`}>
                                            <label className={`${showBrief ? "font-bold text-sm" : "text-xs text-gray-500"}`}>
                                                {t`Priority`}
                                            </label>
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button size="sm" variant="light" className="flex-1 justify-start">
                                                        {task?.priority ? (
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
                                                            onPress={() => handleUpdateTask({ priority: option.value })}
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

                                        {/* Status */}
                                        <div className={`flex flex-1 items-center ${showBrief ? "flex-col" : ""} gap-1`}>
                                            <label className={`${showBrief ? "font-bold text-sm" : "text-xs text-gray-500"}`}>
                                                {t`Status`}
                                            </label>
                                            <Popover>
                                                <PopoverTrigger>
                                                    <Button size="sm" variant="light" className="flex-1 justify-start">
                                                        <Tag size="large" className={`${ToDoColumnClasses[column.process_id]} !p-2`}>
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
                                                                    if (col.id !== column.id) {
                                                                        handleUpdateTask({ column_id: col.id });
                                                                        onChange?.(task.id, col.id);
                                                                    };
                                                                }}
                                                            >
                                                                {col.name}
                                                            </ListboxItem>
                                                        ))}
                                                    </Listbox>
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        {/* Deadline */}
                                        <div className={`flex flex-1 items-center ${showBrief ? "flex-col" : ""} gap-1`}>
                                            <label className={`${showBrief ? "font-bold text-sm" : "text-xs text-gray-500"}`}>
                                                {t`Deadline`}
                                            </label>
                                            <Popover isOpen={openDeadlinePopover} onOpenChange={setOpenDeadlinePopover}>
                                                <PopoverTrigger>
                                                    <Button size="sm" variant="light" className="flex-1 justify-start text-gray-500">
                                                        {task?.deadline ? new Date(task.deadline)?.toLocaleDateString() : t`No Deadline`}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent>
                                                    <DateCalendar
                                                        onChange={handleSelectDeadline}
                                                        value={task?.deadline ? new Date(task.deadline) : undefined}
                                                        shadow={false}
                                                        className="!border-none"
                                                        highlightToday={false}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>

                                    {/* 其他行：一列 */}
                                    <div className="flex gap-1 items-center">
                                        <label className="text-xs text-gray-500">{t`Assignee`}</label>
                                        <MemberDropdown
                                            members={members || []}
                                            isFetching={isFetching}
                                            onKeywordChange={onKeywordChange}
                                            selectedKeys={
                                                Array.isArray(selectedAssigneeIDs)
                                                    ? selectedAssigneeIDs
                                                    : Array.from(selectedAssigneeIDs)
                                            }
                                            onAction={handleSelectAssignee}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`flex flex-1 items-center ${showBrief ? "flex-col" : ""} gap-1`}>
                                        <label className={`${showBrief ? "font-bold text-sm" : "text-xs text-gray-500"}`}>
                                            {t`Priority`}
                                        </label>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button size="sm" variant="light" className="flex-1 justify-start">
                                                    {task?.priority ? (
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
                                                        onPress={() => handleUpdateTask({ priority: option.value })}
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

                                    {/* Status */}
                                    <div className={`flex flex-1 items-center ${showBrief ? "flex-col" : ""} gap-1`}>
                                        <label className={`${showBrief ? "font-bold text-sm" : "text-xs text-gray-500"}`}>
                                            {t`Status`}
                                        </label>
                                        <Popover>
                                            <PopoverTrigger>
                                                <Button size="sm" variant="light" className="flex-1 justify-start">
                                                    <Tag size="large" className={`${ToDoColumnClasses[column.process_id]} !p-2`}>
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
                                                                if (col.id !== column.id) {
                                                                    handleUpdateTask({ column_id: col.id });
                                                                    onChange?.(task.id, col.id);
                                                                };
                                                            }}
                                                        >
                                                            {col.name}
                                                        </ListboxItem>
                                                    ))}
                                                </Listbox>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Deadline */}
                                    <div className={`flex flex-1 items-center ${showBrief ? "flex-col" : ""} gap-1`}>
                                        <label className={`${showBrief ? "font-bold text-sm" : "text-xs text-gray-500"}`}>
                                            {t`Deadline`}
                                        </label>
                                        <Popover isOpen={openDeadlinePopover} onOpenChange={setOpenDeadlinePopover}>
                                            <PopoverTrigger>
                                                <Button size="sm" variant="light" className="flex-1 justify-start text-gray-500">
                                                    {task?.deadline ? new Date(task.deadline)?.toLocaleDateString() : t`No Deadline`}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <DateCalendar
                                                    onChange={handleSelectDeadline}
                                                    value={task?.deadline ? new Date(task.deadline) : undefined}
                                                    shadow={false}
                                                    className="!border-none"
                                                    highlightToday={false}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Assignee */}
                                    <div className="flex gap-1 items-center">
                                        <label className="text-xs text-gray-500">{t`Assignee`}</label>
                                        <MemberDropdown
                                            members={members || []}
                                            isFetching={isFetching}
                                            onKeywordChange={onKeywordChange}
                                            selectedKeys={
                                                Array.isArray(selectedAssigneeIDs)
                                                    ? selectedAssigneeIDs
                                                    : Array.from(selectedAssigneeIDs)
                                            }
                                            onAction={handleSelectAssignee}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div>
                            <BlockNoteEditor
                                options={{ placeholder: { emptyDocument: t`Write something about the task` } }}
                                className="task-editor"
                                noteID={task.id}
                            // content={}
                            />
                        </div>

                        <Divider className="my-2 bg-gray-200" />
                    </div>

                    <div className={`flex-1 flex flex-col ${showBrief ? "" : "max-w-[50%]"}`}>
                        {
                            !showBrief ? (
                                <Tabs size="sm" classNames={{ panel: "overflow-auto" }}>
                                    <Tab title={t`Comments`}>
                                        <Comments
                                            onFilterChange={(filter) => setCommentParams((prev) => ({ ...prev, ...filter }))}
                                            filter={commentParams}
                                            taskId={task.id}
                                            currentUser={currentUser}
                                        />
                                    </Tab>
                                    <Tab title={t`Activity`}>
                                        <TaskActivity activities={activities} />
                                    </Tab>
                                </Tabs>
                            ) : (
                                <Comments
                                    onFilterChange={(filter) => setCommentParams((prev) => ({ ...prev, ...filter }))}
                                    filter={commentParams}
                                    taskId={task.id}
                                    currentUser={currentUser}
                                />
                            )
                        }
                    </div>
                </div>
            </div>
        </CommentActionsProvider>
    )
}

export default TaskDetails;