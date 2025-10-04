// column.tsx
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { columnKey, TaksPayload, TaskState, ToDoColumn } from "../type";
import { useTodo } from "@/contexts/TodoContext";
import invariant from "tiny-invariant";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Tag } from "@douyinfe/semi-ui";
import { Button } from "@heroui/button";
import { EllipsisHorizontalIcon, ExclamationCircleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { isCardOver, ToDoColumnClasses } from "./script";
import { isCardData } from "../script";
import { Dropdown } from '@douyinfe/semi-ui';
import { CirclePicker } from 'react-color';
import {
    Divider,
    Listbox,
    ListboxItem,
    ListboxSection,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure,
} from "@heroui/react";

import { useLingui } from "@lingui/react/macro";
import { IconDelete, IconEdit2Stroked } from "@douyinfe/semi-icons";
import {
    attachClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import Task from "../task";
/** 指示条：插在两个 task 之间 */
function GapIndicator() {
    return (
        <div className="relative my-1">
            <div className="h-0.5 w-full bg-blue-300 rounded-full" />
        </div>
    );
}


const Column = ({ children, column }: { children: ReactNode; column: ToDoColumn }) => {
    const idle = { type: "idle" } as TaskState;
    const { t } = useLingui();
    const outerRef = useRef<HTMLDivElement | null>(null);
    const innerRef = useRef<HTMLDivElement | null>(null);
    const headerRef = useRef<HTMLDivElement | null>(null);
    const columnNameRef = useRef<HTMLSpanElement | null>(null);
    const [templateColor, setTemplateColor] = useState<string>("");
    const [isOpenPopover, setIsOpenPopover] = useState(false);
    const [columnNameEditable, setColumnNameEditable] = useState(false);
    const [_, setState] = useState<TaskState>(idle);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const pendingRenameRef = useRef(false); // 记录“等待重命名聚焦”
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const loadingLockRef = useRef(false);
    const { startDraftTask, updateTask, loadMoreTasks, cleanColumnTasks, updateColumn, activeDraft, updateDraftTask } = useTodo();
    const {
        isOpen: isOpenCleanModal,
        onOpen: onOpenCleanModal,
        onOpenChange: onOpenCleanModalChange,
    } = useDisclosure();

    // 以数组形式操作 children，方便插入指示条
    const childArray = useMemo(() => React.Children.toArray(children), [children]);

    // 计算某个 Y 坐标应插入到哪一个 gap（0..N）
    const computeDropIndex = (clientY: number): number => {
        const container = innerRef.current;
        if (!container) return 0;

        // 只拿带 data-task-id 的元素（Task 的 wrapper）
        const nodes = Array.from(
            container.querySelectorAll<HTMLElement>("[data-task-id]")
        ).filter((el) => el.offsetParent !== null); // 可见

        if (nodes.length === 0) return 0;

        // 遍历每个 task 的中线，鼠标在它上方则插到它前面
        for (let i = 0; i < nodes.length; i++) {
            const rect = nodes[i].getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (clientY <= mid) {
                return i; // 插到第 i 个 task 之前
            }
        }
        // 否则插到末尾
        return nodes.length;
    };

    const tryLoadMore = useMemo(() => {
        return async () => {
            if (!column.has_next) return;
            if (loadingLockRef.current) return;
            loadingLockRef.current = true;
            try {
                await loadMoreTasks(column.id);
            } finally {
                loadingLockRef.current = false;
            }
        };
    }, [column.has_next, loadMoreTasks, column.id]);

    useEffect(() => {
        const outer = outerRef.current;
        const sentinel = sentinelRef.current;
        if (!outer || !sentinel) return;

        // 用列表容器作为 root，让“滚动到底部”更稳定
        const io = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting) {
                    // 到底部了，拉下一页
                    tryLoadMore();
                }
            },
            {
                root: outer,         // 以列的滚动容器为 root
                rootMargin: "0px",
                threshold: 0.01,     // 只要有一点点可见就触发
            }
        );

        io.observe(sentinel);
        return () => io.disconnect();
    }, [tryLoadMore]);

    // 根据 dropIndex 计算 before/after_task_id，并调用 updateTask
    // const commitInsert = (sourceTaskId: string, index: number) => {
    //     const container = innerRef.current;
    //     if (!container) return;

    //     const nodes = Array.from(container.querySelectorAll<HTMLElement>("[data-task-id]"));
    //     const ids = nodes.map((n) => n.dataset.taskId!).filter(Boolean);

    //     // 空列
    //     if (ids.length === 0) {
    //         updateTask(sourceTaskId, { column_id: column.id } as any);
    //         return;
    //     }

    //     // index == 0 => 插到第一个前面
    //     if (index <= 0) {
    //         updateTask(sourceTaskId, { column_id: column.id, before_task_id: ids[0] } as any);
    //         return;
    //     }

    //     // index == ids.length => 插到最后一个后面
    //     if (index >= ids.length) {
    //         updateTask(sourceTaskId, {
    //             column_id: column.id,
    //             after_task_id: ids[ids.length - 1],
    //         } as any);
    //         return;
    //     }

    //     // 中间：插到 ids[index] 前面
    //     updateTask(sourceTaskId, { column_id: column.id, before_task_id: ids[index] } as any);
    // };

    const handleSubmitColumnName = () => {
        if (!columnNameEditable) return;
        moveCaretToStartAndBlur(columnNameRef.current);
        setColumnNameEditable(false);
        const value = columnNameRef.current?.innerText.trim() ?? "";
        updateColumn(column.id, { name: value })
    };

    // 让“列表区域”成为唯一的 drop target：拖动时计算 gap、渲染指示条；落下时提交 before/after
    useEffect(() => {
        const outer = outerRef.current;
        const inner = innerRef.current;
        invariant(inner);
        invariant(outer);

        return combine(
            dropTargetForElements({
                element: outer,
                getIsSticky: () => true,
                // getHitbox: () => inner.getBoundingClientRect(),
                getData: ({ input }) =>
                    attachClosestEdge(
                        { column, [columnKey]: true },
                        { element: inner, input, allowedEdges: ["top", "bottom"] }
                    ),
                canDrop: ({ source }) => {
                    return isCardData(source.data)
                },

                onDrag: ({ location }) => {
                    setState(isCardOver);
                    const y = location.current.input.clientY;
                    const idx = computeDropIndex(y);
                    setDropIndex(idx);
                },
                onDragEnter: ({ location }) => {
                    setState(isCardOver);
                    const y = location.current.input.clientY;
                    const idx = computeDropIndex(y);
                    setDropIndex(idx);
                },
                onDragLeave: () => {
                    setState(idle);
                    setDropIndex(null);
                },
                onDragStart: ({ location }) => {
                    setState(isCardOver);
                    const y = location.current.input.clientY;
                    const idx = computeDropIndex(y);
                    setDropIndex(idx);
                },
                onDrop: () => {
                    setState(idle);
                    setDropIndex(null);
                },
            }),
        );
    }, [column.id, updateTask]);

    // 把光标移到 contentEditable 末尾
    function focusEditableEnd(el: HTMLElement) {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
        el.focus({ preventScroll: true } as any);

        // 内容为空时放一个零宽字符，避免无法放置光标
        if ((el.textContent ?? "").length === 0) {
            el.appendChild(document.createTextNode("\u200b"));
        }

        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);

        const sel = window.getSelection();
        try {
            sel?.removeAllRanges();
            sel?.addRange(range);
        } catch {
            // ignore
        }
    }

    function moveCaretToStartAndBlur(el?: HTMLElement | null) {
        if (!el) return;
        // 折叠 selection 到开头
        const range = document.createRange();
        try {
            range.selectNodeContents(el);
        } catch (e) {
            return;
        }
        range.collapse(true); // 折叠到开头

        const sel = window.getSelection();
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
        }

        // 如果元素可水平滚动，重置滚动位置到开头
        // （若元素为 inline，可能需要将其变为 inline-block 或 block 才能滚动）
        try {
            (el as HTMLElement).scrollLeft = 0;
        } catch (e) {
            // ignore
        }
    }


    // Dropdown 关闭后再聚焦到列名，避免被 restoreFocus 抢走
    useEffect(() => {
        if (!isOpenPopover && columnNameEditable && pendingRenameRef.current) {
            pendingRenameRef.current = false;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const el = columnNameRef.current;
                    if (el) focusEditableEnd(el);
                });
            });
        }
    }, [isOpenPopover, columnNameEditable]);

    const handleCreate = () => {
        startDraftTask(column.id, { single: "submit" });
    };

    const handeUpdate = (_: string, payload: TaksPayload) => {
        updateDraftTask(payload);
    }

    // 把指示条插到 childArray 的第 dropIndex 个位置（0..N）
    const childrenWithIndicator = useMemo(() => {
        if (dropIndex == null) return childArray;
        const cloned = [...childArray];
        // 指示条是独立节点，不影响 data-task-id 选择
        cloned.splice(dropIndex, 0, <GapIndicator key="__gap-indicator__" />);
        return cloned;
    }, [childArray, dropIndex]);

    return (
        <>
            <div ref={outerRef} className="group h-full flex flex-col  overflow-y-auto relative shrink-0">
                {/* 头部 */}
                <div ref={headerRef} className="sticky rounded-b-none py-[15px] px-[20px] z-[50] min-w-[280px] top-0 items-center">

                    <div className="flex items-center justify-between">
                        <Tag type="ghost" shape="circle" className="z-[130] cursor-pointer text-base font-semibold">
                            <span
                                ref={columnNameRef}
                                tabIndex={0}
                                contentEditable={columnNameEditable}
                                onClick={() => {
                                    if (!columnNameEditable) { setColumnNameEditable(true); pendingRenameRef.current = true }
                                }}

                                className={`whitespace-nowrap max-w-[100px] overflow-hidden ${columnNameEditable ? "" : "truncate"}`}
                                suppressContentEditableWarning={true}
                                onBlur={handleSubmitColumnName}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault(); // 阻止换行
                                        e.currentTarget.blur(); // 主动触发 blur（提交后收起编辑）
                                    }
                                }}
                            >
                                {column.name}
                            </span>

                        </Tag>

                        {/* 触发器容器：重命名中强制可见；hover 可见；focus-within 可见 */}
                        <div
                            className={`gap-1 transition-opacity
                        ${columnNameEditable
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                                }`}
                        >
                            <Button
                                onPress={handleCreate}
                                isIconOnly
                                radius="full"
                                variant="light"
                                size="sm"
                                className="z-[130] relative"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </Button>

                            <Dropdown position="bottom"
                                className="dark:!bg-black"
                                render={
                                    <Listbox className="z-[130] relative">
                                        <ListboxSection showDivider classNames={{ base: "mb-1", divider: "mt-1" }}>
                                            <ListboxItem
                                                startContent={<IconEdit2Stroked />}
                                                key={"rename"}
                                                onPress={() => {
                                                    // 标记待重命名：先关下拉，再在 effect 里聚焦列名
                                                    pendingRenameRef.current = true;
                                                    setColumnNameEditable(true);
                                                    setIsOpenPopover(false);
                                                }}
                                            >
                                                {t`Rename`}
                                            </ListboxItem>

                                        </ListboxSection>
                                        <ListboxSection title={t`Appearance`} showDivider>
                                            <ListboxItem
                                                key={"background"}
                                                className="hover:!bg-transparent"
                                            >
                                                <div
                                                    onMouseLeave={() => setTemplateColor('')} // 离开时恢复原色
                                                >
                                                    <CirclePicker onChange={(e: any) => updateColumn(column.id, { color: e.hex })} onSwatchHover={(color: any) => setTemplateColor(color.hex)} colors={['#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3', '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF']} circleSpacing={9} circleSize={24} width="200px"></CirclePicker>
                                                </div>
                                            </ListboxItem>
                                        </ListboxSection>
                                        <ListboxSection classNames={{ base: "mb-0" }}>
                                            <ListboxItem
                                                key="clear"
                                                startContent={<IconDelete />}
                                                color="danger"
                                                onPress={() => {
                                                    setIsOpenPopover(false);
                                                    onOpenCleanModal();
                                                }}
                                            >
                                                {t`Clear Tasks`}
                                            </ListboxItem>
                                        </ListboxSection>
                                    </Listbox>
                                }
                            >
                                <Button radius="full" isIconOnly variant="light" size="sm" className="z-[130] relative">
                                    <EllipsisHorizontalIcon className="w-4 h-4" />
                                </Button>
                            </Dropdown>

                            <Modal isOpen={isOpenCleanModal} size="sm" onOpenChange={onOpenCleanModalChange}>
                                <ModalContent>
                                    <ModalHeader></ModalHeader>
                                    <ModalBody>
                                        <div>
                                            <h3 className="text-lg font-medium">
                                                {t`Are you sure you want to clear all tasks in this column?`}
                                            </h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-2 my-2">
                                                <ExclamationCircleIcon className="w-5 h-5" />
                                                {t`This is a very dangerous action. Once confirmed, the data cannot be recovered.`}
                                            </p>
                                        </div>
                                    </ModalBody>
                                    <ModalFooter className="pt-0">
                                        <Button onPress={onOpenCleanModalChange} className="w-full">
                                            {t`Don’t clear`}
                                        </Button>
                                        <Button
                                            className="w-full"
                                            color="danger"
                                            onPress={() => {
                                                cleanColumnTasks(column.id);
                                                onOpenCleanModalChange();
                                            }}
                                        >
                                            {t`I'm sure`}
                                        </Button>
                                    </ModalFooter>
                                </ModalContent>
                            </Modal>
                        </div>
                    </div>

                    {
                        activeDraft && activeDraft.columnId === column.id && (
                            <>
                                <div className="z-[130] relative mt-2">
                                    <Task task={activeDraft.task} column={column} onUpdate={handeUpdate}>
                                    </Task>
                                    <div className="mt-2">
                                        <Button className="min-w-0 h-6 text-xs px-3" color="primary">{t`Create`}</Button>
                                    </div>
                                    <Divider className="mt-4"></Divider>
                                </div>
                            </>
                        )
                    }

                    {/* 顶部叠层背景（保留你的原有视觉层） */}
                    <div className="absolute overflow-hidden inset-0 bg-white dark:bg-black z-[15]" />
                    <div
                        style={{ backgroundColor: `${templateColor || column.color}26` || 'inherit' }}

                        className={`absolute overflow-hidden rounded-t-lg inset-0 z-[20] ${ToDoColumnClasses[column.process_id]}`}
                    />
                </div >
                {/* 列体（列表区域是唯一 drop target） */}
                < div
                    style={{ backgroundColor: `${templateColor || column.color}26` || 'inherit' }
                    }
                    className={`${ToDoColumnClasses[column.process_id]} w-full rounded-b-lg  min-w-[280px] gap-2 flex flex-col`}
                >
                    <div ref={innerRef} className="flex flex-col relative gap-2 w-full">
                        {childrenWithIndicator}
                    </div>

                    <Button onPress={handleCreate} size="sm" className="min-h-[32px] w-full" variant="light">
                        <PlusIcon className="h-5 text-gray-300 w-5" />
                    </Button>

                    <div ref={sentinelRef} />
                </div >
            </div >
        </>
    );
};

export default Column;
