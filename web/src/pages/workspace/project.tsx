import AvatarMenu from "@/components/avatarMenu";
import { ArrowLeftIcon, ArrowsUpDownIcon, ChevronRightIcon, Cog6ToothIcon, EllipsisHorizontalIcon, FaceSmileIcon, FunnelIcon, MagnifyingGlassIcon, RectangleGroupIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { Key, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import { IconSidebar } from '@douyinfe/semi-icons';
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Input,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Drawer,
    DrawerContent,
    DropdownSection
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
import { useParams, useSearchParams } from "react-router-dom";
import { useProjectTodo } from "@/hooks/useTodoTask";
import ChaseLoading from "@/components/loading/Chase/loading";
import TodoContext, { useTodo } from "@/contexts/TodoContext";
import { isCardData, isCardDropTargetData, isColumnData } from "@/components/todo/script";
import TodoList from "@/components/todo/main";
import { ProjectPayload, ProjectSettingsPayload } from "@/features/api/type";
import ProjectList from "@/components/project/list";
import { i18n } from "@lingui/core";
import { pickEmojiMartI18n } from "@/utils/emojiMartI18n";
import EmojiPicker from "@/components/emojiPicker";



function ListItem(props: { title: React.ReactNode, description?: React.ReactNode, EndContext?: React.ReactNode, StartContext?: React.ReactNode, onClick?: () => void, className?: string }) {
    return (
        <div onClick={props?.onClick} className={`px-3 w-full py-2 h-[32px] justify-between flex items-center text-sm ${props.className}`}>
            {
                props.StartContext && (
                    <div className="mr-1">
                        {props.StartContext}
                    </div>
                )
            }
            <span className="flex gap-2 items-center text-[13px] ">
                {props.title}
            </span>
            <div className="flex items-center gap-1 text-[13px]">
                <span className="text-gray-400">
                    {props.description}
                </span>
                {
                    props.EndContext
                }
            </div>
        </div>
    )
}

function TodoSort(props: { fields: { name: string, label: string, value: string }[], onSelect?: (value: { field: string, asc: boolean }) => void, onClose?: () => void }) {
    const { t } = useLingui();
    const [page, setPage] = useState(0);
    const { todoParams, setTodoParams } = useTodo();
    const [params, setParams] = useState(todoParams);
    const handleSelectField = (key: string) => {
        setPage(1);
        setParams({ order_by: key });
    }

    useEffect(() => {
        setParams(todoParams);
    }, [todoParams])

    const handleSelectAsc = (asc: boolean) => {
        if (todoParams) {
            const newSort = { ...params, asc };
            setTodoParams(newSort);
        }
        props.onClose?.();
    }

    const back = () => {
        setPage(0);
    }

    return (
        page == 0 ? (
            <div className="w-full">
                <div className="pl-1 text-tiny text-foreground-500 py-1">
                    {t`Sort by`}
                </div>
                {
                    props.fields.map((field) => (
                        <ListItem title={field.label} onClick={() => handleSelectField(field.value)} className="hover:bg-default rounded-lg" key={field.value} >
                        </ListItem>
                    ))
                }
            </div>
        ) : (
            <>
                <div className="flex items-center gap-0.5 h-[28px] w-full">
                    <Button className="w-[28px] h-[28px] min-w-0" variant="light" onPress={back} isIconOnly>
                        <ArrowLeftIcon className="w-3.5 h-3.5 " />
                    </Button>
                    {t`Back`}
                </div>
                <ListItem title={t`Ascending`} className="hover:bg-default rounded-lg" onClick={() => handleSelectAsc(true)}  >
                </ListItem>
                <ListItem title={t`Descending`} className="hover:bg-default rounded-lg" onClick={() => handleSelectAsc(false)}>
                </ListItem>
            </>
        )

    )
}

function ProjectPage() {
    const { t } = useLingui();
    const [searchParams] = useSearchParams();
    const i18nDict = pickEmojiMartI18n(i18n.locale)
    const params = useParams();
    // const navigate = useNavigate();
    const workspaceID = params.id || "";
    const projectID = searchParams.get("project_id") || "";
    const boardRef = useRef<HTMLDivElement | null>(null);
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const todoInterface = useProjectTodo(projectID, workspaceID)
    const { columns, updateTask, currentProject, isLoading, updateProjectSetting } = todoInterface;
    const [openSiderBar, setOpenSiderBar] = useState(false);
    const [openSortPopover, setOpenSortPopover] = useState(false);
    const [isOpenIconPicker, setIsOpenIconPicker] = useState(false);
    const [openSettingIconPickerPopover, setOpenSettingIconPickerPopover] = useState(false);
    const CardPreviewMapping: Record<string, string> = {
        cover: t`Cover`,
        none: t`none`,
    };
    const SortOptions = [
        { label: t`Default Sort`, value: 'order', name: 'orderIndex' },
        { label: t`Updated Time`, value: 'updated_at', name: 'updatedAt' },
        { label: t`Priority`, value: 'priority', name: 'priority' }
    ]

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
                    if (isColumnData(dropTargetData)) {
                        const destinationColumnIndex = columns.findIndex(
                            (column) => column.id === dropTargetData.column.id,
                        );
                        const destination = columns[destinationColumnIndex];

                        if (!destination) {
                            return;
                        }
                        const closestEdge = extractClosestEdge(dropTargetData);
                        if (home.id === destination.id) {
                            if (closestEdge == "top") {
                                if (cardIndexInHome === 0) {
                                    return;
                                }
                                updateTask(dragging.task.id, { column_id: destination.id, before_id: home.tasks[0].id } as any, { insertIndex: 0 });
                            } else if (closestEdge == "bottom") {
                                if (cardIndexInHome === home.tasks.length - 1) {
                                    return;
                                }
                                updateTask(dragging.task.id, { column_id: destination.id, after_id: home.tasks[home.tasks.length - 1].id } as any, { insertIndex: home.tasks.length - 1 });
                            }
                            return;
                        }
                        if (closestEdge == "top") {
                            if (destination.tasks.length == 0) {
                                updateTask(dragging.task.id, { column_id: destination.id } as any, { insertIndex: 0 });
                            } else {
                                updateTask(dragging.task.id, { column_id: destination.id, before_id: destination.tasks[0].id } as any, { insertIndex: 0 });
                            }
                        } else if (closestEdge == "bottom") {
                            if (destination.tasks.length == 0) {
                                updateTask(dragging.task.id, { column_id: destination.id } as any, { insertIndex: 0 });
                            } else {
                                updateTask(dragging.task.id, { column_id: destination.id, after_id: destination.tasks[destination.tasks.length - 1].id } as any, { insertIndex: destination.tasks.length });
                            }
                        }
                        return
                    }

                }
            }))
    }, [columns])

    function handlerUpdateProjectSetting(payload: Partial<ProjectSettingsPayload>) {
        if (!currentProject) {
            return Promise.reject(new Error("no project"));
        }
        return updateProjectSetting(payload);
    }

    function handleUpdateProject(payload: Partial<ProjectPayload>) {
        if (!currentProject) {
            return Promise.reject(new Error("no project"));
        }
        return todoInterface.updateProject(payload);
    }
    const SB = 288; // 18rem

    return (
        <>
            <TodoContext.Provider value={todoInterface}>
                <div className="flex-1 min-w-0 flex flex-col relative">
                    <div className="flex z-[2000] items-center h-[40px] px-2 py-1 justify-between ">
                        {/* 头部 */}
                        <div className="flex gap-2.5 items-center">
                            {!isDesktop && (
                                <AvatarMenu />
                            )}

                            {
                                !openSiderBar ?
                                    <IconSidebar onClick={() => setOpenSiderBar(true)} className={`${openSiderBar && isDesktop ? "!hidden" : ""} text-gray-500`} /> :
                                    <IconSidebar onClick={() => setOpenSiderBar(false)} className="text-gray-500 rotate-180" />
                            }

                        </div>

                        <div className="flex items-center gap-1">
                            <Popover onClose={() => setIsOpenIconPicker(false)} isOpen={isOpenIconPicker} classNames={{ content: "shadow p-0" }}>
                                <PopoverTrigger>
                                    <div className="cursor-pointer px-1 hover:bg-gray-100 rounded-lg" style={{ transform: "scale(1.3)" }} onClick={() => setIsOpenIconPicker(!isOpenIconPicker)}>
                                        {currentProject?.icon}
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <EmojiPicker i18n={i18nDict} onSelect={(emoji: any) => { handleUpdateProject({ icon: emoji.native }); setIsOpenIconPicker(false) }} />
                                </PopoverContent>
                            </Popover>
                            <div contentEditable className="py-1 px-2 flex text-md hover:bg-gray-100 rounded-lg items-center gap-1" >
                                <span>{currentProject && currentProject.name}</span>
                            </div>
                        </div>

                        <div>
                            <Button isIconOnly size="sm" variant="light" radius="full" >
                                <EllipsisHorizontalIcon className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                    <motion.div
                        className=" h-full flex-1 min-w-0 min-h-0"
                        initial={false}
                        animate={{ ["--sb-w"]: openSiderBar ? "18rem" : "0rem" } as any}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                    >
                        {
                            isDesktop ?
                                <>
                                    <motion.aside
                                        className="absolute  pt-2 left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200  overflow-hidden"
                                        initial={false}
                                        animate={{ x: openSiderBar ? 0 : -SB, opacity: openSiderBar ? 1 : 0 }}
                                        transition={{ duration: 0.28, ease: "easeInOut" }}
                                        style={{ pointerEvents: openSiderBar ? "auto" : "none" }}
                                    >
                                        {/* <div className="px-2 py-1 flex items-center h-[40px]">
                                        </div> */}
                                        <div className="mt-[40px] flex-1 overflow-visible">
                                            <ProjectList />
                                        </div>
                                    </motion.aside>
                                </> :
                                <>
                                    <Drawer isOpen={openSiderBar} onClose={() => setOpenSiderBar(false)}>
                                        <DrawerContent>
                                            test
                                        </DrawerContent>
                                    </Drawer>
                                </>
                        }
                        <motion.main
                            layout
                            className="project-cls h-full flex flex-col flex-1 min-w-0 max-w-full box-border"
                            style={{ paddingLeft: "var(--sb-w)" }}
                        >
                            <div className="flex-1 flex flex-col max-w-full ps-4 pe-4 lg:ps-24 lg:pe-24 overflow-auto" ref={boardRef}>
                                {
                                    isLoading ? (
                                        <ChaseLoading text={t`Loading project...`}>
                                        </ChaseLoading>
                                    ) : (
                                        <div className="flex items-center justify-between ">
                                            <div className="h-[26px]">
                                                <Input className="h-full min-h-0" placeholder={t`Typing for search...`} classNames={{ inputWrapper: "min-h-0 h-full" }} startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />}>
                                                </Input>
                                            </div>
                                            <div>
                                                <Button size="sm" radius="full" variant="light" isIconOnly>
                                                    <FunnelIcon className="text-gray-400 w-4 h-4" />
                                                </Button>
                                                <Popover isOpen={openSortPopover} onClose={() => setOpenSortPopover(false)}>
                                                    <PopoverTrigger>
                                                        <Button size="sm" radius="full" variant="light" isIconOnly onClick={() => setOpenSortPopover(!openSortPopover)}>
                                                            <ArrowsUpDownIcon className="text-gray-400 w-4 h-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[200px] test">
                                                        <TodoSort fields={SortOptions} onClose={() => setOpenSortPopover(false)} />
                                                    </PopoverContent>
                                                </Popover>
                                                <Dropdown closeOnSelect={false} autoFocus={true} size="sm" classNames={{ content: "p-1" }}>
                                                    <DropdownTrigger>
                                                        <Button size="sm" radius="full" variant="light" isIconOnly>
                                                            <Cog6ToothIcon className="text-gray-400 w-4 h-4" />
                                                        </Button>
                                                    </DropdownTrigger>
                                                    <DropdownMenu classNames={{ base: "w-[250px] mt-0" }} >
                                                        <DropdownSection title={t`Personalization`} classNames={{ base: "mb-0" }}>
                                                            <DropdownItem key="card_preview" className="p-0 h-[32px] data-[focus-visible=true]:bg-inherit" aria-label="card preview">
                                                                <Dropdown backdrop={"blur"} placement="left" classNames={{ content: "w-[150px] min-w-0" }}  >
                                                                    <DropdownTrigger>
                                                                        <div>
                                                                            <ListItem title={
                                                                                <>
                                                                                    <RectangleGroupIcon className="h-[20px] text-gray-500" />
                                                                                    {t`Card Preview`}
                                                                                </>
                                                                            }
                                                                                description={
                                                                                    <>
                                                                                        <span className="text-gray-400">
                                                                                            {CardPreviewMapping[currentProject?.settings?.card_preview || "none"]}
                                                                                        </span>
                                                                                    </>
                                                                                }
                                                                                EndContext={<ChevronRightIcon className="w-4 h-4 ml-1" />}
                                                                            >
                                                                            </ListItem>
                                                                        </div>
                                                                    </DropdownTrigger>
                                                                    <DropdownMenu onAction={(key: Key) => handlerUpdateProjectSetting({ card_preview: key.toString() as "none" | "cover" })} aria-label="card preview" >
                                                                        <DropdownItem key="none" className="h-[28px]">
                                                                            {t`None`}
                                                                        </DropdownItem>
                                                                        <DropdownItem key="cover" className="h-[28px]">
                                                                            {t`Cover`}
                                                                        </DropdownItem>
                                                                    </DropdownMenu>
                                                                </Dropdown>
                                                            </DropdownItem>
                                                            <DropdownItem key="project_icon" className="p-0 h-[32px]" aria-label="project icon">
                                                                <Popover backdrop={"blur"} isOpen={openSettingIconPickerPopover} onClose={() => setOpenSettingIconPickerPopover(false)} classNames={{ content: "shadow p-0" }}>
                                                                    <PopoverTrigger>
                                                                        <div onClick={() => setOpenSettingIconPickerPopover(!openSettingIconPickerPopover)}>
                                                                            <ListItem title={
                                                                                <>
                                                                                    <FaceSmileIcon className="h-[20px] text-gray-500" />
                                                                                    {t`Project Icon`}
                                                                                </>
                                                                            }
                                                                                description={
                                                                                    <>
                                                                                        <span className="text-gray-400">
                                                                                            {currentProject?.icon}
                                                                                        </span>
                                                                                    </>
                                                                                }
                                                                                EndContext={<ChevronRightIcon className="w-4 h-4 ml-1" />}
                                                                            >
                                                                            </ListItem>
                                                                        </div>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent>
                                                                        <EmojiPicker i18n={i18nDict} onSelect={(emoji: any) => { handleUpdateProject({ icon: emoji.native }); setOpenSettingIconPickerPopover(false) }} />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </DropdownItem>
                                                        </DropdownSection>
                                                    </DropdownMenu>
                                                </Dropdown>
                                            </div>
                                        </div>
                                    )
                                }
                                <TodoList columns={columns}></TodoList>
                            </div>

                        </motion.main>
                    </motion.div >
                </div>
            </TodoContext.Provider >
        </>
    )
}

export default ProjectPage;