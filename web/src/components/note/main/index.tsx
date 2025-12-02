import { NoteProps } from "./script";
import { useLingui } from "@lingui/react/macro";
import { useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "lodash";
import { AutoUpdateContent, createNoteSyncPolicyRequest, createTemplateNoteRequest, deleteNoteSyncPolicyRequest, getNoteSyncPoliciesRequest, getTemplateListRequest, SetFavoriteNoeRequest, UpdateNote } from "@/features/api/note";
import { useParams } from "react-router-dom";
import { responseCode } from "@/features/constant/response";
import {
    Modal,
    ModalContent,
    ModalBody,
    useDisclosure,
    Button,
    ListboxSection,
    Listbox,
    ListboxItem,
    Switch,
    Select,
    SelectItem,
    SharedSelection,
    Input,
    Image,
    ModalHeader,
    ModalFooter,
} from "@heroui/react";
import { useDroppable } from '@dnd-kit/react';
import ShareIcon from "../../icons/share";
import "./style.css"
import LinkIcon from "../../icons/link";
import LockIcon from "../../icons/lock";
import SettingsWrapper from "../../setting/wrapper";
import SettingsItem from "../../setting/item";
import { Note } from "@/pages/workspace/type";
import toast from "react-hot-toast";
import { IconSidebar } from "@douyinfe/semi-icons"
import SquareIcon from "../../icons/square";
import { store } from "@/store";
import { UpdateNoteByID } from "@/store/features/workspace";
import DeleteNoteModal from "@/components/modal/note/deleteModal";
import { CameraIcon, CloudArrowUpIcon, Cog8ToothIcon, CubeIcon, PlusIcon, SparklesIcon, StarIcon, ViewColumnsIcon } from "@heroicons/react/24/outline";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";
import BlockNoteEditor from "@/components/third-party/BlockNoteEditor";
import { Tabs, Tab } from "@heroui/tabs";
import { useMediaQuery } from "react-responsive";
import AvatarMenu from "@/components/avatarMenu";
import AIChat from "@/components/ai/chat";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { UploadFile } from "@/lib/upload";
import TemplateCard from "@/components/template/card";
import { TemplateNote } from "@/components/template/type";
import { useDragDropMonitor } from '@dnd-kit/react';
import Loading from "@/components/loading/Chase/loading";
import NewSyncModal from "@/components/modal/note/addSync";
import { IntegrationProvider } from "@/contexts/IntegrationContext";
import useIntegration from "@/hooks/useIntegration";
import { SynchronizationPolicyPayload } from "@/components/modal/note/addSync/type";
import { SyncPayload } from "@/features/api/type";
import { SyncPolicy } from "@/types/sync";
import { NotePolicyCard } from "@/components/card/notePolicy";
import { Block } from "@blocknote/core";
import { PatchOp } from "@/types/note";


const iconSize = 14

function NoteSettingModal({ isOpen, onOpenChange, activeKey, note, workspaceID }: { isOpen: boolean, onOpenChange: (open: boolean) => void, activeKey?: string, note: Note, workspaceID: any }) {
    const { t } = useLingui();
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedKey, setSelectedKey] = useState([activeKey || "permission"]);
    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onOpenChange: onOpenDeleteModalChange } = useDisclosure();
    const { isOpen: isOpenNewSyncModal, onOpenChange: onOpenNewSyncModalChange } = useDisclosure();
    const isSyncTab = selectedKey[0] === "sync";
    const integrationEnabled = isSyncTab || isOpenNewSyncModal;
    const value = useIntegration({
        enabledApps: integrationEnabled,
        enabledAccounts: integrationEnabled,
    })
    const [policy, setPolicy] = useState<SyncPolicy[]>([])
    const [_, setPolicyTotal] = useState(0);
    const state = store.getState()
    const handleSelectionChange = (keys: any) => {
        setSelectedKey([keys.currentKey]);
    };
    const updateNoteSetting = async (key: string, value: any) => {
        let res = await UpdateNote(workspaceID, note.id, {
            [key]: value,
            updated_at: note.updated_at
        })
        if (res.code == responseCode.SUCCESS) {
            toast.success(t`Update successfully`);
            store.dispatch(UpdateNoteByID({ id: note.id, changes: { [key]: value, updated_at: res.data.note.updated_at } }))
        } else {
            store.dispatch(UpdateNoteByID({ id: note.id, changes: { updated_at: res.data.note.updated_at } }))
            toast.error(res.error);

        }
    }

    const disabledList = useMemo(() => {
        let list = [];
        if (!note.allow_share) {
            list.push("link", "notion", "wechat");
        }
        return list;
    }, [note.allow_share, note.allow_invite]);

    /**
     * Updates the category of a note in the workspace and reflects changes in the store.
     * 
     * @param key - The shared selection object containing the new category ID as currentKey
     * @returns A Promise that resolves when the note category update operation completes
     * 
     * @remarks
     * This function:
     * 1. Extracts the category ID from the selection object
     * 2. Makes an API call to update the note's category
     * 3. Updates the Redux store with the new category on success
     * 4. Shows a success or error toast notification based on the result
     */
    const switchNoteCategory = async (key: SharedSelection) => {
        let category_id = key.currentKey;
        if (!category_id) return;
        let res = await UpdateNote(workspaceID, note.id, {
            category_id: category_id
        })
        if (res.code == responseCode.SUCCESS) {
            store.dispatch(UpdateNoteByID({ id: note.id, changes: { category_id } }))
            toast.success(t`Update successfully`);
        } else {
            toast.error(res.error);
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) {
            toast.error(t`Please select a file to upload.`);
            return;
        }
        let controller = UploadFile({ file, accept: "image/*" })
        const { url } = await controller.promise;
        let res = await UpdateNote(workspaceID, note.id, { cover: url, updated_at: note.updated_at })
        if (res.code == responseCode.SUCCESS) {
            store.dispatch(UpdateNoteByID({ id: note.id, changes: { cover: url, updated_at: res.data.note.updated_at } }))
        } else {
            store.dispatch(UpdateNoteByID({ id: note.id, changes: { updated_at: res.data.note.updated_at } }))
        }
    }


    const onCreatePolicy = async (payload: SynchronizationPolicyPayload) => {
        var res = await createNoteSyncPolicyRequest(note.id, workspaceID, payload as SyncPayload)
        if (res.code == responseCode.SUCCESS) {
            setPolicy([res.data, ...policy])
            return true;
        } else {
            console.log(res.code == responseCode.ERROR_FEISHU_GET_FILE_META_FAILED)
            if (res.code == responseCode.ERROR_FEISHU_GET_FILE_META_FAILED) {
                toast.error(t`Failed to get file metadata from Feishu. Please ensure the file exists and you have access to it.`);
            }
        }
        return false
    }

    const handleOnDelete = async (syncID: string) => {
        var res = await deleteNoteSyncPolicyRequest(note.id, workspaceID, syncID)
        if (res.code == responseCode.SUCCESS) {
            setPolicy(policy.filter((p) => p.id !== syncID))
            toast.success(t`Delete synchronization policy success`);
        }
    }

    useEffect(() => {
        if (integrationEnabled) {
            getNoteSyncPoliciesRequest(note.id, workspaceID).then((res) => {
                if (res.code == responseCode.SUCCESS) {
                    setPolicy(res?.data?.policies || [])
                    setPolicyTotal(res?.data?.total || 0);
                }
            })
        }
    }, [integrationEnabled, note.id, workspaceID]);

    return (
        <Modal classNames={{ base: "z-[1100] !my-auto" }} isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" className="max-h-[715px] share-modal">
            <ModalContent >
                {() => (
                    <>
                        <ModalBody className="p-0 h-full">

                            <div className="flex h-full">
                                <Listbox disallowEmptySelection hideSelectedIcon={false} disabledKeys={disabledList} selectionMode="single" shouldHighlightOnFocus variant="flat" aria-label="Share Modal" className="w-56 h-full bg-slate-50 dark:bg-[#191919] px-3 py-2" selectedKeys={selectedKey} onSelectionChange={handleSelectionChange}>
                                    <ListboxSection showDivider title={t`General`}>
                                        <ListboxItem key="management" startContent={<SquareIcon size={iconSize} />}>{t`Management`}</ListboxItem>
                                        <ListboxItem key="permission" startContent={<LockIcon size={iconSize} />}>{t`Permission`}</ListboxItem>
                                    </ListboxSection>
                                    <ListboxSection title={t`Share`} >
                                        <ListboxItem key="link" startContent={<LinkIcon size={iconSize} />} >{t`Invite Link`}</ListboxItem>
                                        <ListboxItem key="sync" startContent={<CloudArrowUpIcon className="w-3.5" />}>{t`Synchronization`}</ListboxItem>
                                    </ListboxSection>
                                </Listbox>
                                <div className="flex-1 px-16 py-9 gap-4 dark:bg-[#191919] flex flex-col overflow-y-auto">
                                    {selectedKey[0] == "management" && (
                                        <>
                                            <SettingsWrapper title={t`Basic Information`}>
                                                <SettingsItem label={t`Note ID`} description={t`The unique ID of the note.`}>
                                                    <div className="text-slate-500">{note.id}</div>
                                                </SettingsItem>
                                                <SettingsItem label={t`Category`} description={t`Categorize the note by selecting an existing note category.`}>
                                                    <Select size="sm" defaultSelectedKeys={[String(note.category_id)]} className="w-32" onSelectionChange={switchNoteCategory} >
                                                        {state.workspace.categoryList.map((category) => (
                                                            <SelectItem key={category.id} className="text-slate-500">{category.category_name || t`No Category`}</SelectItem>
                                                        ))}
                                                    </Select>
                                                </SettingsItem>
                                                <SettingsItem label={t`Cover`}
                                                    description={t`The cover image is displayed at the top of the note and in the template thumbnail. Leave it blank to use the first image in the note.`}>
                                                    <Button size="sm" type="button" color="primary" onPress={() => { inputRef.current?.click() }} >
                                                        {t`Upload`}
                                                    </Button>
                                                    <Input
                                                        type="file"
                                                        ref={inputRef}
                                                        className="hidden"
                                                        onChange={handleUpload}
                                                    />
                                                </SettingsItem>
                                            </SettingsWrapper>
                                            <SettingsWrapper title={t`Note Settings`}>
                                                <SettingsItem label={t`Enable Share`} description={t`Allow sharing this note with others or third-party applications.`} >
                                                    <Switch defaultSelected={note.allow_share} onValueChange={(value) => updateNoteSetting("allow_share", value)} />
                                                </SettingsItem>
                                                <SettingsItem label={t`Enable Edit`} description={t`Allow editing this note.`} >
                                                    <Switch defaultSelected={note.allow_edit} onValueChange={(value) => updateNoteSetting("allow_edit", value)} />
                                                </SettingsItem>
                                            </SettingsWrapper>
                                            <SettingsWrapper title={t`Danger Zone`}>
                                                <SettingsItem label={t`Delete Note`} description={t`Deleting this item is a permanent action and cannot be reversed. Proceed with caution.`} >
                                                    <Button color="danger" size="sm" onPress={onOpenDeleteModal}>
                                                        {t`Delete Note`}
                                                    </Button>
                                                </SettingsItem>
                                            </SettingsWrapper>
                                            <DeleteNoteModal isOpen={isOpenDeleteModal} onOpenChange={onOpenDeleteModalChange} note={note}></DeleteNoteModal>
                                        </>
                                    )}
                                    {selectedKey[0] == "permission" && (
                                        <SettingsWrapper title={t`Permission`}>
                                            <SettingsItem label={t`Note Status`} description={t`Set the current note's status. When set to private, it will be invisible to others.`}>
                                                <Select size="sm" defaultSelectedKeys={[note.status]} className="w-32" onSelectionChange={(key) => updateNoteSetting("status", key.currentKey)}>
                                                    <SelectItem key="public">{t`Public`}</SelectItem>
                                                    <SelectItem key="Private">{t`Private`}</SelectItem>
                                                </Select>
                                            </SettingsItem>
                                            <SettingsItem label={t`Note Status`} description={t`Set the current note's status. When set to private, it will be invisible to others.`}>
                                                <Switch defaultSelected={note.allow_edit} onValueChange={(value) => updateNoteSetting("allow_edit", value)}></Switch>
                                            </SettingsItem>
                                        </SettingsWrapper>
                                    )}
                                    {selectedKey[0] == "link" && (
                                        <div>
                                            <SettingsWrapper title="Link">
                                                <SettingsItem label="link">
                                                    <Switch size="sm"></Switch>
                                                </SettingsItem>
                                            </SettingsWrapper>
                                        </div>
                                    )}
                                    {selectedKey[0] == "sync" && (
                                        <IntegrationProvider value={value}>
                                            <div className=" flex-1">
                                                <SettingsWrapper title={t`Synchronization`} itemClasses="h-full" className="h-full" endComponent={<Button onPress={onOpenNewSyncModalChange} className="w-[55px] h-[26px] !text-xs min-w-0" radius="sm" color="primary">{t`Add`}</Button>}>
                                                    <div className="h-full overflow-y-auto border border-slate-200 rounded-lg p-4">
                                                        {
                                                            policy.length == 0 ? (
                                                                <div className="flex justify-center h-full items-center text-sm text-gray-500 text-center py-10">
                                                                    {t`No synchronization policies yet. Click the "Add" button to create one.`}
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div>
                                                                        {policy.map((p) => <NotePolicyCard policy={p} onDelete={handleOnDelete} />)}
                                                                    </div>
                                                                </>
                                                            )
                                                        }
                                                    </div>
                                                </SettingsWrapper>
                                                <NewSyncModal onCreate={onCreatePolicy} workspaceID={workspaceID} noteID={note.id} isOpen={isOpenNewSyncModal} onOpenChange={onOpenNewSyncModalChange}></NewSyncModal>
                                            </div>
                                        </IntegrationProvider>

                                    )}
                                    {selectedKey[0] == "wechat" && (
                                        <div>
                                            wechat
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal >
    )
}

function Prologues() {
    return (
        <>
            <div className="flex gap-5 flex-col mb-4 ">
                <div className="text-lg font-medium text-center">
                    What can I help you write?
                </div>
                <div className="flex gap-4 flex-col m-auto text-start">
                    <div className="text-sm text-gray-500">
                        🌍 Translate & summarize text
                    </div>
                    <div className="text-sm text-gray-500">
                        📝 Outline with AI mind-map
                    </div>
                    <div className="text-sm text-gray-500">
                        ✒️ Polish grammar & style
                    </div>
                    <div className="text-sm text-gray-500">
                        💡 Brainstorm or extend drafts
                    </div>
                    <div className="text-sm text-gray-500">
                        💬 Chat about any writing
                    </div>
                </div>
            </div>
        </>
    )
}


function NoteSidebar({ note }: { note: Note }) {
    const { t } = useLingui();
    const params = useRef({
        limit: 10,
        offset: 0,
    })
    const [total, setTotal] = useState(0);
    const [data, setData] = useState<TemplateNote[]>([]);

    function newTemplate() {
        return (
            <div className="cursor-pointer flex flex-1 items-center justify-center flex-col">
                <PlusIcon className="h-8 w-8 text-gray-400 mx-auto"></PlusIcon>
            </div>
        )
    }


    async function handleCreateNewTemplate() {
        let newNote = await createTemplateNoteRequest(note.workspace_id, note?.content || "", note?.title || t`New Template`, note?.cover)
        if (newNote) {
            setData((prev) => [newNote, ...prev]);
        }
    }
    useEffect(() => {
        getTemplateListRequest(note.workspace_id, params.current.limit, params.current.offset).then((res) => {
            setTotal(res.data.total);
            setData(res.data.data || []);
        })
    }, [])

    return (
        <>
            <div className="flex-1 h-full flex flex-col min-w-52">
                <Tabs classNames={
                    {
                        panel: "flex-1 overflow-y-auto",
                    }
                } size="sm">
                    <Tab title={<SparklesIcon className="h-4 w-4"></SparklesIcon>}>
                        <AIChat prologues={<Prologues />} className="!pb-0"></AIChat>
                    </Tab>
                    <Tab className="flex flex-col" title={<CubeIcon className="h-4 w-4"></CubeIcon>}>
                        <div className="my-2">
                            <h3 className="font-medium font-mono">
                                {t`Templates`}
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <TemplateCard empty onClick={handleCreateNewTemplate} emptyRender={
                                newTemplate
                            } />
                            {data.map((note => (
                                <TemplateCard draggable key={note.id} note={note} />
                            )))}

                        </div>
                        {
                            total <= data.length && (
                                <div className="text-xs text-gray-400 text-center mt-4 select-none">
                                    {t`No more templates to load.`}
                                </div>
                            )
                        }
                    </Tab>
                </Tabs>
            </div>
        </>
    )
}

export default function NotePage(props: NoteProps) {
    const { t } = useLingui();
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const isLaptop = useMediaQuery({ minWidth: 768 });
    const [isResizing, setIsResizing] = useState(false);
    const { isDropTarget, ref } = useDroppable({
        id: "note",
    });
    const [isTemplateApplying, setIsTemplateApplying] = useState(false);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [templateContent, setTemplateContent] = useState<any>({});
    const [content, _] = useState<Block[]>(props.note.content);
    const [openSide, setOpenSide] = useState(false);
    const params = useParams();
    // const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
    // const [saving, setSaving] = useState<boolean>(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { isOpen: isOpenSetting, onOpen: onOpenSetting, onOpenChange: onOpenSettingChange } = useDisclosure();
    const handleEditTitle = () => {
        setIsEditingTitle(true);
        if (inputRef) {
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }
    const handleChangeContent = debounce((newContent: PatchOp[]) => {
        if (params.id == undefined || isTemplateApplying) return;
        if (newContent.length != 0) {
            AutoUpdateContent({
                actions: newContent,
                workspace_id: params.id,
                note_id: props.note.id,
                updated_at: props.note.updated_at
            }).then((res) => {
                if (res.code == responseCode.SUCCESS) {
                    store.dispatch(UpdateNoteByID({ id: props.note.id, changes: res.data.note }))
                } else {
                    store.dispatch(UpdateNoteByID({ id: props.note.id, changes: { updated_at: res?.data?.updated_at } }))
                }
            })
        }
    }, 500)

    const handleStarNote = async () => {
        SetFavoriteNoeRequest(props.note.workspace_id, props.note.id, !props.note.is_favorite)
        store.dispatch(UpdateNoteByID({ id: props.note.id, changes: { is_favorite: !props.note.is_favorite } }))
    }

    const handleBlurTitle = () => {
        setIsEditingTitle(false);
        store.dispatch(UpdateNoteByID({ id: props.note.id, changes: { title: inputRef.current ? inputRef.current.value : props.note.title } }))
    }

    const handleResizeStart = (isDragging: boolean) => {
        setIsResizing(isDragging);
    };

    const overwriteNoteContent = async (data: any) => {
        if (!params.id || !content) return;
        setIsTemplateApplying(true); // 设置为 true，表示正在应用模板
        store.dispatch(UpdateNoteByID({ id: props.note.id, changes: data }))
        UpdateNote(params.id, props.note.id, data)
        setTemplateContent("");
        if (isOpen) {
            onOpenChange();
        }
        setTimeout(() => {
            setIsTemplateApplying(false);
        }, 600); // 下一轮事件循环，确保 setState 已完成
    }

    useDragDropMonitor({
        onDragEnd(event) {
            if (isDropTarget) {
                const { source } = event.operation;
                const templateNoteContent = source?.data
                if (props.note.content.length != 0) {
                    setTemplateContent(templateNoteContent);
                    onOpen();
                } else {
                    overwriteNoteContent(templateNoteContent);
                }
            }
        }
    })

    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="z-[1100]" >
                <ModalContent>
                    <ModalHeader>
                        <span>
                            {t`Overwrite Note`}
                        </span>
                    </ModalHeader>
                    <ModalBody>
                        <div>
                            {t`Existing content detected. Importing the template will overwrite it. Continue?`}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" variant="light" onPress={onOpenChange} className="mr-2">
                            {t`Cancel`}
                        </Button>
                        <Button size="sm" color="primary" onPress={() => overwriteNoteContent(templateContent)}>
                            {t`Confirm`}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <PanelGroup direction="horizontal" className="flex h-full w-full">
                <Panel className="flex flex-1 w-min-0 w-full flex-col h-screen">
                    <div className="test h-11 flex items-center justify-between px-4">
                        <div className="flex items-center">
                            <span className="mr-2">
                                {
                                    isDesktop ? (
                                        <Button variant="light" isIconOnly size="sm" className="px-2" onPress={() => props.setCollapsed(!props.isCollapsed)}>
                                            <ViewColumnsIcon></ViewColumnsIcon>
                                        </Button>
                                    ) : (
                                        <>
                                            <AvatarMenu>
                                            </AvatarMenu>
                                        </>
                                    )
                                }
                            </span>
                            {
                                isEditingTitle ? <Input ref={inputRef} size="sm" defaultValue={props.note.title} onBlur={handleBlurTitle}></Input> : <span onClick={handleEditTitle} className="text-sm w-40 block hover:text-accent-foreground hover:bg-accent py-1 px-2 rounded-lg cursor-pointer" > {props.note.title}</span>
                            }

                        </div>
                        <div className={`flex items-center ${isLaptop ? "gap-2" : "gap-1"}`}>
                            <Button variant="light" isIconOnly size="sm" className="px-2" onPress={handleStarNote} >
                                {
                                    !props.note.is_favorite ? <StarIcon className=""></StarIcon> : <SolidStarIcon className="text-yellow-400"></SolidStarIcon>
                                }
                            </Button>
                            <Button variant="light" isIconOnly size="sm" className="px-2" onPress={onOpenSetting}>
                                <ShareIcon></ShareIcon>
                            </Button>
                            <Button variant="light" isIconOnly size="sm" className="px-2" onPress={onOpenSetting}>
                                <Cog8ToothIcon className="w-5 h-5"></Cog8ToothIcon>
                            </Button>
                            <Button variant="light" isIconOnly size="sm" className="px-2" onPress={() => setOpenSide(!openSide)}>
                                <IconSidebar className="rotate-180"></IconSidebar>
                            </Button>
                            <NoteSettingModal isOpen={isOpenSetting} onOpenChange={onOpenSettingChange} note={props.note} workspaceID={params.id}></NoteSettingModal>
                        </div>
                    </div>
                    <div ref={ref} className="flex-1 relative overflow-y-auto">
                        {
                            props.note.cover && (
                                <>
                                    <div className="relative group ">
                                        <Image loading="lazy" width={`100%`} className="object-cover object-center" height={"30vh"} removeWrapper radius="none" src={props.note.cover} alt="Note Cover">
                                        </Image>
                                        <Button isIconOnly size="sm" radius="sm" className="z-50 absolute bottom-2 right-2 group-hover:opacity-100 opacity-0 transition-all duration-300">
                                            <CameraIcon className="w-4 h-4 text-gray-500"></CameraIcon>
                                        </Button>
                                    </div>
                                </>
                            )
                        }
                        <div className=" flex-1 whitespace-normal transition-all duration-300 min-w-0 flex p-4">
                            <BlockNoteEditor noteID={props.note.id} options={{
                                editable: props.note.allow_edit,
                            }}
                                content={props.note.content}
                                onChange={handleChangeContent}
                            />

                        </div>
                        {
                            isTemplateApplying && (
                                <>
                                    <div className="absolute opacity-50 bottom-0 right-0 text-xs h-full z-[1001] w-full bg-gray-500 px-2 py-1">
                                        <Loading color="#fff" text={t`Applying the template...`} textClassName="text-white dark:text-white" />
                                    </div>
                                </>
                            )
                        }
                    </div>
                </Panel>
                <PanelResizeHandle
                    onDragging={handleResizeStart}
                    className={`relative px-1 ${openSide ? "" : "hidden"}`}>
                    <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 border-l-[0.5px] border-gray-300"></div>
                </PanelResizeHandle>
                <Panel
                    maxSize={35}
                    minSize={25}
                    className={`transition-all ${isResizing ? "duration-0" : "duration-300"} ease-in-out will-change-[flex] ${openSide ? "" : "!flex-[0_0_0%]"} overflow-hidden  h-full`}
                >
                    <div className="p-2 h-full">
                        <NoteSidebar note={props.note}></NoteSidebar>
                    </div>
                </Panel>
            </PanelGroup>

        </>
    )
}

