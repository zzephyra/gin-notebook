import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { type HTMLAttributes, CSSProperties, memo, useCallback, useEffect, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import "@/components/todo/style.css"
import {
    attachClosestEdge,
    type Edge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import "./style.css"
import { Priority, TaksPayload, TaskState, ToDoColumn, TodoTask } from '../type';
import { CardBody, Card, Avatar, Input, Dropdown, DropdownTrigger, Button, DropdownMenu, DropdownItem, Drawer, DrawerContent, DrawerBody, useDisclosure, DrawerHeader, Divider, Popover, PopoverTrigger, PopoverContent, Listbox, ListboxSection, ListboxItem } from '@heroui/react';
import { Tag } from '@douyinfe/semi-ui';
import { i18n } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { useParams } from 'react-router-dom';
import { WorkspaceMember } from '@/types/workspace';
import { debounce, set } from 'lodash';
import { FlagIcon } from '@heroicons/react/24/solid';
import { capitalizeWord } from '@/utils/tools';
import { useTodo } from '@/contexts/TodoContext';
import { ToDoColumnClasses } from '../column/script';
import { PriorityOptions } from './script';
import MemberDropdown from '@/components/dropdown/member';
import BlockNoteEditor from '@/components/third-party/BlockNoteEditor';
import Comments from '@/components/comment/main';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { TaskCommentFilter, TaskCommentParams } from '@/features/api/type';
import { useTaskCommentsController } from '@/hooks/useComments';
import { CommentActionsProvider } from '@/contexts/CommentContext';
import { IconBackTop, IconClose } from '@douyinfe/semi-icons';
import { Calendar as DateCalendar, DateObject } from "react-multi-date-picker";
import dayjs from 'dayjs';
type Orientation = 'horizontal' | 'vertical';


const edgeToOrientationMap: Record<Edge, Orientation> = {
    top: 'horizontal',
    bottom: 'horizontal',
    left: 'vertical',
    right: 'vertical',
};

const orientationStyles: Record<Orientation, HTMLAttributes<HTMLElement>['className']> = {
    horizontal:
        'h-[--line-thickness] left-[--terminal-radius] right-0 before:left-[--negative-terminal-size]',
    vertical:
        'w-[--line-thickness] top-[--terminal-radius] bottom-0 before:top-[--negative-terminal-size]',
};

const edgeStyles: Record<Edge, HTMLAttributes<HTMLElement>['className']> = {
    top: 'top-[--line-offset] before:top-[--offset-terminal]',
    right: 'right-[--line-offset] before:right-[--offset-terminal]',
    bottom: 'bottom-[--line-offset] before:bottom-[--offset-terminal]',
    left: 'left-[--line-offset] before:left-[--offset-terminal]',
};

const strokeSize = 2;
const terminalSize = 8;
const offsetToAlignTerminalWithLine = (strokeSize - terminalSize) / 2;


const TagAttributesMap: Record<Priority, any> = {
    high: { 'type': 'light', "size": "small", "color": "red" },
    medium: { 'type': 'light', "size": "small", "color": "amber" },
    low: { 'type': 'light', "size": "small", "color": "lime" },
};

/**
 * This is a tailwind port of `@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box`
 */
export function DropIndicator({ edge, gap }: { edge: Edge; gap: string }) {
    const lineOffset = `calc(-0.5 * (${gap} + ${strokeSize}px))`;

    const orientation = edgeToOrientationMap[edge];

    return (
        <div
            style={
                {
                    '--line-thickness': `${strokeSize}px`,
                    '--line-offset': `${lineOffset}`,
                    '--terminal-size': `${terminalSize}px`,
                    '--terminal-radius': `${terminalSize / 2}px`,
                    '--negative-terminal-size': `-${terminalSize}px`,
                    '--offset-terminal': `${offsetToAlignTerminalWithLine}px`,
                } as CSSProperties
            }
            className={`absolute z-10 bg-blue-700 pointer-events-none before:content-[''] before:w-[--terminal-size] before:h-[--terminal-size] box-border before:absolute before:border-[length:--line-thickness] before:border-solid before:border-blue-700 before:rounded-full ${orientationStyles[orientation]} ${[edgeStyles[edge]]}`}
        ></div>
    );
}

const idle: TaskState = { type: 'idle' };



const PriorityColorMap: Record<Priority, string> = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
}

function Task({ task, column }: { task: TodoTask, column: ToDoColumn }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const params = useParams();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [state, setState] = useState<TaskState>(idle);
    const { t } = useLingui();
    const [searchParams, setSearchParams] = useState({ limit: 10, keywords: "" });
    const { data: members, isFetching } = useWorkspaceMembers(params.id || "", searchParams);
    const titleRef = useRef<HTMLInputElement>(null);
    const composingRef = useRef(false);
    const [isEdit, setIsEdit] = useState({
        title: false,
    })
    const drawerBodyRef = useRef<HTMLDivElement | null>(null);
    const [showBackTop, setShowBackTop] = useState(false);
    const { submitTask, updateTask, activeOverlay, columns } = useTodo();
    const taskRef = useRef<HTMLDivElement | null>(null);
    const assigneeRef = useRef<HTMLDivElement | null>(null);
    const priorityRef = useRef<HTMLDivElement | null>(null);
    const [openDeadlinePopover, setOpenDeadlinePopover] = useState(false);
    const [selectedAssigneeIDs, setSelectedAssigneeIDs] = useState<Set<string>>(new Set(task.assignee?.map((assignee) => assignee.id) || []));
    const selectedRef = useRef(selectedAssigneeIDs);
    const currentUser: WorkspaceMember = useSelector((state: RootState) => {
        return {
            id: state.workspace.currentWorkspace?.member_id || "",
            workspace_nickname: state.workspace.currentWorkspace?.member_nickname,
            avatar: state.user.avatar,
            email: state.user.email,
            user_nickname: state.user.nickname || "",
            role: state.workspace.currentWorkspace?.roles || [],
        }
    });
    const [commentParams, setCommentParams] = useState<TaskCommentParams>({ task_id: task.id, member_id: currentUser.id, workspace_id: params.id || "", limit: 10, offset: 0 });

    const commentsController = useTaskCommentsController(commentParams, { enabled: isOpen });
    useEffect(() => { selectedRef.current = selectedAssigneeIDs; }, [selectedAssigneeIDs]);

    useEffect(() => {
        setSelectedAssigneeIDs(new Set((task.assignee || []).map((assignee) => assignee.id)));
    }, [task.id])

    useEffect(() => {
        const element = ref.current;
        invariant(element);
        return combine(
            draggable({
                element,
                getInitialData() {
                    return {
                        ...task,
                        type: 'item',
                    };
                },
                onDragStart() {
                    setState({ type: 'is-dragging' });
                },
                onDrop() {
                    setState(idle);
                },
            }),
            dropTargetForElements({
                element,
                getIsSticky() {
                    return true;
                },
                canDrop({ source }) {
                    // not allowing dropping on yourself
                    if (source.element === element) {
                        return false;
                    }
                    // only allowing tasks to be dropped on me
                    return true;
                },
                getData({ input }) {
                    const data = task;
                    return attachClosestEdge(data, {
                        element,
                        input,
                        allowedEdges: ['top', 'bottom'],
                    });
                },
                onDragEnter({ self }) {
                    const closestEdge = extractClosestEdge(self.data);
                    setState({ type: 'is-dragging-over', closestEdge });
                },
                onDrag({ self }) {
                    const closestEdge = extractClosestEdge(self.data);
                    setState((current) => {
                        if (current.type === 'is-dragging-over' && current.closestEdge === closestEdge) {
                            return current;
                        }
                        return { type: 'is-dragging-over', closestEdge };
                    });
                },
                onDragLeave() {
                    setState(idle);
                },
                onDrop() {
                    setState(idle);
                },
            }),
        );
    }, [task]);

    useEffect(() => { }), [task.isEdit]

    const onKeywordChange = debounce(
        (value: string) => {
            console.log(value)
            setSearchParams(prev => ({
                ...prev,
                keywords: value
            }));
        }, 500
    );

    const handleUpdateTask = (payload: TaksPayload) => {
        updateTask(task.id, payload);
    }

    const handleSelectAssignee = (keys: any) => {
        setSelectedAssigneeIDs((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(keys)) {
                newSet.delete(keys);
                updateTask(task.id, { assignee_actions: { action_remove: [keys] } });
            } else {
                newSet.add(keys);
                updateTask(task.id, { assignee_actions: { action_add: [keys] } });
            }
            return newSet;
        });
    }

    const handleClick = () => {
        if (task.isEdit) {
            return;
        }
        onOpen();
    }

    const scrollDrawerToTop = useCallback(() => {
        const el = drawerBodyRef.current;
        if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        setShowBackTop(el.scrollTop > 100);
    }, []);

    useEffect(() => {
        // Drawer 打开后再绑定滚动监听
        const el = drawerBodyRef.current;
        if (!el) return;

        const onScroll = () => {
            setShowBackTop(el.scrollTop > 100);
        };

        el.addEventListener("scroll", onScroll, { passive: true });
        onScroll(); // 打开时立即计算一次

        return () => el.removeEventListener("scroll", onScroll);
    }, [isOpen]);
    const switchEditStatus = (fields: keyof typeof isEdit) => {
        setIsEdit((prev) => {
            return {
                ...prev,
                [fields]: !prev[fields]
            }
        })
    }

    const updateFilter = (filter: Partial<TaskCommentFilter>) => {
        setCommentParams((prev) => {
            return {
                ...prev,
                ...filter,
            }
        });
    }



    useEffect(() => {
        if (isEdit.title) titleRef.current?.focus();
    }, [isEdit.title]);

    const startEditTitle = () => {
        if (!isEdit.title) switchEditStatus("title");
    };

    const commitTitle = () => {
        const next = (titleRef.current?.textContent || "").trim();
        if (next !== (task.title || "")) handleUpdateTask({ title: next });
        if (isEdit.title) switchEditStatus("title");
    };

    const cancelTitle = () => {
        if (titleRef.current) titleRef.current.textContent = task.title || "";
        if (isEdit.title) switchEditStatus("title");
    };

    const handleSelectDeadline = (date: DateObject | null) => {
        if (!date) return
        const dt = date?.toDate();
        dt.setHours(0, 0, 0, 0);
        handleUpdateTask({ deadline: dayjs(dt).format("YYYY-MM-DD") });
        setOpenDeadlinePopover(false);
    }

    const onTitleKeyDown: React.KeyboardEventHandler<HTMLHeadingElement> = (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent?.stopImmediatePropagation?.();
            cancelTitle();
            return;
        }
        if (e.key === "Enter" && !composingRef.current) {
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent?.stopImmediatePropagation?.();
            commitTitle();
        }
    };

    useEffect(() => {
        if (isEdit.title && titleRef.current) {
            titleRef.current.focus();
        }
    }, [isEdit.title]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (task.isEdit && !(taskRef.current?.contains(e.target as Node) || assigneeRef.current?.contains(e.target as Node) || priorityRef.current?.contains(e.target as Node))) {
                let addAssignees = Array.from(selectedRef.current)
                submitTask(task.id, {
                    assignee_actions: {
                        action_add: addAssignees,
                    },
                })
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <CommentActionsProvider value={commentsController}>
                <div className="relative w-3xs" ref={taskRef} onClick={handleClick}>
                    <Card ref={ref} className={`shadow-none background-white ${task.isEdit ? "" : "cursor-pointer"}`}>
                        <CardBody>
                            {
                                task.isEdit ? (
                                    <>
                                        <div className='flex flex-col gap-2'>
                                            <Input size='sm' classNames={{ input: 'text-xs' }} defaultValue={task.title || ''} onValueChange={(value) => handleUpdateTask({ title: value })} placeholder={t`New Project`}></Input>
                                            <div className='flex gap-1 items-center'>
                                                <MemberDropdown members={members || []} menuRef={assigneeRef} isFetching={isFetching} onKeywordChange={onKeywordChange} selectedKeys={Array.from(selectedAssigneeIDs)} onAction={handleSelectAssignee} ref={assigneeRef} />
                                            </div>
                                            <Dropdown backdrop="blur">
                                                <DropdownTrigger>
                                                    <Button size='sm' variant='light' className='w-full justify-start gap-1'>
                                                        {
                                                            task.priority ? (
                                                                <>
                                                                    <div className='flex gap-1 items-center'>
                                                                        <FlagIcon className={`w-4 h-4 ${PriorityColorMap[task.priority]}`} />
                                                                        <span className='text-xs text-gray-500 truncate'>
                                                                            {i18n._(capitalizeWord(task.priority))}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChartBarIcon className='rotate-90 w-4 h-4 text-gray-400' />
                                                                    <span className='text-xs  text-gray-500 truncate'>
                                                                        {t`Select Priority`}
                                                                    </span>
                                                                </>
                                                            )
                                                        }
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu ref={priorityRef}>
                                                    {
                                                        PriorityOptions.map((option) => (
                                                            <DropdownItem key={option.value} onPress={() => handleUpdateTask({ priority: option.value })} >
                                                                <div className='flex gap-2 items-center'>
                                                                    <FlagIcon className={`w-4 h-4 ${PriorityColorMap[option.value]}`} />
                                                                    <span className='text-xs text-gray-500 truncate'>
                                                                        {t`${option.label}`}
                                                                    </span>
                                                                </div>
                                                            </DropdownItem>
                                                        ))
                                                    }
                                                </DropdownMenu>
                                            </Dropdown>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className='text-sm text-gray-500 mb-2'>
                                            {task.title || t`New Task`}
                                        </div>
                                        <div className='flex justify-between items-center'>
                                            <div className='flex gap-2 items-end'>
                                                {
                                                    task.assignee && (
                                                        <>
                                                            {/* <AvatarGroup size='sm' max={3} > */}
                                                            {
                                                                task.assignee.map((assignee) => (
                                                                    <Avatar key={assignee.id} src={assignee.avatar} alt={assignee.avatar} className="w-6 h-6 text-tiny">
                                                                    </Avatar>
                                                                ))
                                                            }
                                                            {/* </AvatarGroup> */}
                                                        </>
                                                    )
                                                }
                                            </div>
                                            {
                                                task.priority && (
                                                    <Tag size="small" {...TagAttributesMap[task.priority]}>
                                                        {i18n._(task.priority)}
                                                    </Tag>
                                                )
                                            }
                                        </div>
                                    </>
                                )
                            }
                        </CardBody>
                    </Card>

                    {/* <div
                    data-task-id={task.id}
                    ref={ref}
                    className={`flex text-sm bg-white flex-row items-center border border-solid rounded p-2 pl-0 hover:bg-slate-100 hover:cursor-grab ${stateStyles[state.type] ?? ''}`}
                >
                    <div className="w-6 flex justify-center">
                        <GripVertical size={10} />
                    </div>
                    <span className="truncate flex-grow flex-shrink">{task.title}</span>
                </div> */}
                    {state.type === 'is-dragging-over' && state.closestEdge ? (
                        <DropIndicator edge={state.closestEdge} gap={'8px'} />
                    ) : null}
                </div>
                <Drawer isOpen={isOpen}
                    hideCloseButton
                    isDismissable={!activeOverlay}
                    isKeyboardDismissDisabled={activeOverlay}
                    backdrop='transparent' onOpenChange={onOpenChange} size="md" placement="right">
                    <DrawerContent>
                        <DrawerHeader className='pb-0 px-2 flex justify-between items-center'>
                            <div></div>
                            <div className='flex gap-1'>
                                {showBackTop && (
                                    <Button
                                        radius='full'
                                        variant='light'
                                        size='sm'
                                        isIconOnly
                                        onPress={scrollDrawerToTop}
                                    >
                                        <IconBackTop className='text-gray-700' />
                                    </Button>
                                )}
                                <Button radius='full' variant='light' size='sm' isIconOnly onPress={onOpenChange}><IconClose /></Button>
                            </div>
                        </DrawerHeader>
                        <DrawerBody>
                            <div
                                ref={drawerBodyRef}
                                onScroll={handleBodyScroll}
                                className="overflow-y-auto h-full px-2"
                            >
                                <div>
                                    <h1
                                        ref={titleRef}
                                        contentEditable={isEdit.title}
                                        suppressContentEditableWarning
                                        role="textbox"
                                        aria-multiline="false"
                                        onClick={startEditTitle}           // 点击进入编辑
                                        onBlur={commitTitle}               // 失焦自动提交
                                        onKeyDown={onTitleKeyDown}
                                        onCompositionStart={() => (composingRef.current = true)} // 兼容中文输入法
                                        onCompositionEnd={() => (composingRef.current = false)}
                                        className={`text-2xl px-2 pt-1 pb-2 rounded-xl font-bold ${isEdit.title ? "cursor-text" : "cursor-pointer hover:bg-gray-100"
                                            }`}
                                    >
                                        {task.title || t`New Task`}
                                    </h1>

                                </div>
                                <div className='flex'>
                                    <div className='flex flex-1 items-center flex-col gap-1' >
                                        <label className='font-bold text-sm'>
                                            {t`Priority`}
                                        </label>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button size='sm' variant='light'>
                                                    {
                                                        task.priority ? (
                                                            <Tag size="small" {...TagAttributesMap[task.priority]}>
                                                                {i18n._(task.priority)}
                                                            </Tag>
                                                        ) : (
                                                            <span className='text-xs text-gray-500'>
                                                                {t`No Priority`}
                                                            </span>
                                                        )
                                                    }
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu>
                                                {
                                                    PriorityOptions.map((option) => (
                                                        <DropdownItem key={option.value} onPress={() => handleUpdateTask({ priority: option.value })} >
                                                            <div className='flex gap-2 items-center'>
                                                                <FlagIcon className={`w-4 h-4 ${PriorityColorMap[option.value]}`} />
                                                                <span className='text-xs text-gray-500 truncate'>
                                                                    {t`${option.label}`}
                                                                </span>
                                                            </div>
                                                        </DropdownItem>
                                                    ))
                                                }
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                    <Divider className='bg-gray-200' orientation='vertical'></Divider>
                                    <div className='flex flex-1 items-center flex-col gap-1'>
                                        <label className='font-bold text-sm'>
                                            {t`Status`}
                                        </label>
                                        <Popover>
                                            <PopoverTrigger>
                                                <Button size='sm' variant='light'>
                                                    <Tag size="large" shape='circle' className={`${ToDoColumnClasses[column.process_id]} !p-2`} >
                                                        {column.name}
                                                    </Tag>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <Listbox>
                                                    {
                                                        columns.map((col) => (
                                                            <ListboxItem key={col.id} onClick={() => {
                                                                if (col.id !== column.id) handleUpdateTask({ column_id: col.id });
                                                                setOpenDeadlinePopover(false);
                                                            }}>
                                                                {col.name}
                                                            </ListboxItem>
                                                        ))
                                                    }
                                                </Listbox>
                                            </PopoverContent>
                                        </Popover>

                                    </div>
                                    <Divider className='bg-gray-200' orientation='vertical'></Divider>
                                    <div className='flex flex-1 items-center flex-col gap-1'>
                                        <label className='font-bold text-sm'>
                                            {t`Deadline`}
                                        </label>
                                        <Popover isOpen={openDeadlinePopover} onOpenChange={setOpenDeadlinePopover}>
                                            <PopoverTrigger>
                                                <Button size='sm' variant='light' className="text-gray-500">
                                                    {task.deadline ? new Date(task.deadline)?.toLocaleDateString() : t`No Deadline`}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <DateCalendar onChange={handleSelectDeadline} value={task.deadline ? new Date(task.deadline) : undefined} shadow={false} className="!border-none" highlightToday={false}>
                                                </DateCalendar>
                                            </PopoverContent>
                                        </Popover>


                                    </div>
                                </div>
                                <div className='flex flex-col gap-2'>
                                    <div className='flex gap-1 items-center'>
                                        <label className='text-xs text-gray-500'>
                                            {t`Assignee`}
                                        </label>
                                        <MemberDropdown members={members || []} isFetching={isFetching} onKeywordChange={onKeywordChange} selectedKeys={Array.from(selectedAssigneeIDs)} onAction={handleSelectAssignee} />
                                    </div>
                                </div>
                                <div>
                                    <BlockNoteEditor options={{ placeholder: { emptyDocument: t`Write something about the task` } }} className='task-editor' noteID={task.id} content={task.description}></BlockNoteEditor>
                                </div>
                                <Divider className='my-2 bg-gray-200'></Divider>
                                <div>
                                    <Comments onFilterChange={updateFilter} filter={commentParams} taskId={task.id} currentUser={currentUser}></Comments>
                                </div>
                            </div>
                        </DrawerBody>
                    </DrawerContent>
                </Drawer>
            </CommentActionsProvider>
        </>
    );
}

export default memo(Task);