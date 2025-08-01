import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { type HTMLAttributes, CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import invariant from 'tiny-invariant';
import {
    attachClosestEdge,
    type Edge,
    extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { Priority, TaskState, TodoPriorityOption, TodoTask } from '../type';
import { CardBody, Card, Avatar, Input, Dropdown, DropdownTrigger, Button, DropdownMenu, DropdownItem, DropdownSection, AvatarGroup, Drawer, DrawerContent, DrawerBody, useDisclosure, DrawerHeader } from '@heroui/react';
import { Tag } from '@douyinfe/semi-ui';
import { i18n } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { ChartBarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useWorkspaceMembers } from '@/hooks/useWorkspaceMembers';
import { useParams } from 'react-router-dom';
import { WorkspaceMember } from '@/types/workspace';
import { debounce, } from 'lodash';
import ChaseLoading from '@/components/loading/Chase/loading';
import { FlagIcon } from '@heroicons/react/24/solid';
import { capitalizeWord } from '@/utils/tools';
import { useTodo } from '@/contexts/TodoContext';
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

const PriorityOptions: TodoPriorityOption[] = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
];

const PriorityColorMap: Record<Priority, string> = {
    low: 'text-green-500',
    medium: 'text-yellow-500',
    high: 'text-red-500',
}

export function Task({ task }: { task: TodoTask }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const params = useParams();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [state, setState] = useState<TaskState>(idle);
    const { t } = useLingui();
    const [searchParams, setSearchParams] = useState({ limit: 10, keywords: "" });
    const { data, isFetching } = useWorkspaceMembers(params.id || "", searchParams);
    const members: WorkspaceMember[] = useMemo(
        () => data?.pages.flatMap((p) => p.data) ?? [],
        [data],
    );
    const { submitDraftTask, updateDraftTask } = useTodo();
    const taskRef = useRef<HTMLDivElement | null>(null);
    const assigneeRef = useRef<HTMLDivElement | null>(null);
    const priorityRef = useRef<HTMLDivElement | null>(null);
    const selectedAssigneeIDs = useMemo(() => {
        return (task.assignee || []).map((assignee) => assignee.id);
    }, [task.assignee]);
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
            setSearchParams(prev => ({
                ...prev,
                keywords: value
            }));
        }, 500
    )

    const handleSelectPriority = (priority: Priority) => {
        updateDraftTask(task.id, { priority });
        // if (onUpdate) {
        //     onUpdate(task.id, task.columnId, { priority });
        // }
    }

    const handleUpdateTitle = (value: string) => {
        updateDraftTask(task.id, { title: value });
    }

    const handleSelectAssignee = (assignee: WorkspaceMember) => {
        var assignees = task.assignee || [];
        var index = assignees.findIndex((a) => a.id === assignee.id);
        if (index == -1) {
            assignees = [...assignees, {
                avatar: assignee.avatar,
                id: assignee.user_id,
                nickname: assignee.workspace_nickname || assignee.user_nickname || assignee.email,
                email: assignee.email,
            }]
        } else {
            assignees = assignees.filter((a) => a.id !== assignee.id);
        }

        updateDraftTask(task.id, { assignee: assignees });
    }

    const handleClick = () => {
        if (task.isEdit) {
            return;
        }
        onOpen();
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (task.isEdit && !(taskRef.current?.contains(e.target as Node) || assigneeRef.current?.contains(e.target as Node) || priorityRef.current?.contains(e.target as Node))) {
                submitDraftTask(task.id)
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            <div className="relative w-3xs" ref={taskRef} onClick={handleClick}>
                <Card ref={ref} className={`shadow-none background-white ${task.isEdit ? "" : "cursor-pointer"}`}>
                    <CardBody>
                        {
                            task.isEdit ? (
                                <>
                                    <div className='flex flex-col gap-2'>
                                        <Input size='sm' classNames={{ input: 'text-xs' }} defaultValue={task.title || ''} onValueChange={handleUpdateTitle} placeholder={t`New Project`}></Input>
                                        <div className='flex gap-1 items-center'>
                                            <Dropdown closeOnSelect={false} backdrop="opaque">
                                                <DropdownTrigger>
                                                    <Button size='sm' variant='light' className='w-full justify-start gap-1'>
                                                        <UserIcon className='w-4 h-4 text-gray-400' />

                                                        {
                                                            task.assignee?.length ? (
                                                                <>
                                                                    <AvatarGroup className='ml-2'>
                                                                        {
                                                                            task.assignee.map((assignee) => (
                                                                                <>
                                                                                    <Avatar src={assignee.avatar} alt={assignee.avatar} className="w-6 h-6 text-tiny">
                                                                                    </Avatar>
                                                                                </>
                                                                            ))
                                                                        }
                                                                    </AvatarGroup>
                                                                    {/* <span className='text-xs ml-1 text-gray-500'>
                                                                            {task.user.nickname}
                                                                        </span> */}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className='text-xs text-gray-500 truncate'>
                                                                        {t`Select Assignee`}
                                                                    </span>
                                                                </>
                                                            )
                                                        }
                                                    </Button>
                                                </DropdownTrigger>
                                                <DropdownMenu selectionMode="multiple" selectedKeys={selectedAssigneeIDs} ref={assigneeRef}>
                                                    <DropdownSection classNames={{ divider: "mt-0" }} showDivider aria-label="remote search members">
                                                        <DropdownItem key="search member" isReadOnly className='!bg-transparent !px-0'>
                                                            <Input size='sm' isDisabled={isFetching} onValueChange={onKeywordChange} placeholder={t`Look up a person...`} ></Input>
                                                        </DropdownItem>
                                                    </DropdownSection>
                                                    <DropdownSection>
                                                        {
                                                            isFetching ? (
                                                                <>
                                                                    <DropdownItem key="loading" isReadOnly className='!bg-transparent cursor-default !px-0'>
                                                                        <ChaseLoading size="24px" text={t`Loading members...`} textClassName='text-xs' />
                                                                    </DropdownItem>
                                                                </>
                                                            ) : (members.map((member) => (
                                                                <DropdownItem key={member.id} onPress={() => handleSelectAssignee(member)}>
                                                                    <div className='flex gap-1 items-center'>
                                                                        <Avatar src={member.avatar} alt={member.avatar} className="w-6 h-6 text-tiny">
                                                                        </Avatar>
                                                                        <span className='text-xs ml-1 text-gray-500'>
                                                                            {member.workspace_nickname || member.user_nickname || member.email}
                                                                        </span>
                                                                        {
                                                                            member.workspace_nickname && (
                                                                                <>
                                                                                    <span className='text-xs text-gray-500'>
                                                                                        ({member.user_nickname || member.email})
                                                                                    </span>
                                                                                </>
                                                                            )
                                                                        }
                                                                    </div>
                                                                </DropdownItem>
                                                            )))
                                                        }
                                                    </DropdownSection>
                                                </DropdownMenu>
                                            </Dropdown>
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
                                                        <DropdownItem key={option.value} onPress={() => handleSelectPriority(option.value)} >
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
            <Drawer isOpen={isOpen} backdrop='transparent' onOpenChange={onOpenChange} size="md" placement="right">
                <DrawerContent>
                    <DrawerHeader>

                    </DrawerHeader>
                    <DrawerBody>
                        <div >
                            <h1 className='text-2xl font-bold'>{task.title || t`New Task`}</h1>
                        </div>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
}