import { NoteProps } from "./script";
import { useLingui } from "@lingui/react/macro";
import { useMemo, useRef, useState } from "react";
import { debounce } from "lodash";
import { AutoUpdateContent, SetFavoriteNoeRequest, UpdateNote } from "@/features/api/note";
import { useParams } from "react-router-dom";
import { responseCode } from "@/features/constant/response";
import {
    Modal,
    Button,
    ListboxSection,
    ModalContent,
    Listbox,
    ModalBody,
    ListboxItem,
    useDisclosure,
    Switch,
    Select,
    SelectItem,
    SharedSelection,
    Input
} from "@heroui/react";
import ShareIcon from "../../icons/share";
import SettingIcon from "../../icons/setting";
import "./style.css"
import NotionIcon from "../../icons/notion";
import WechatIcon from "../../icons/wechat";
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
import { ChatBubbleLeftEllipsisIcon, SparklesIcon, StarIcon, ViewColumnsIcon } from "@heroicons/react/24/outline";
import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid";
import BlockNoteEditor from "@/components/third-party/BlockNoteEditor";
import { Tabs, Tab } from "@heroui/tabs";
import { useMediaQuery } from "react-responsive";
import AvatarMenu from "@/components/avatarMenu";

const iconSize = 14

function NoteSettingModal({ isOpen, onOpenChange, activeKey, note, workspaceID }: { isOpen: boolean, onOpenChange: (open: boolean) => void, activeKey?: string, note: Note, workspaceID: any }) {
    const { t } = useLingui();
    const [selectedKey, setSelectedKey] = useState([activeKey || "permission"]);
    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onOpenChange: onOpenDeleteModalChange } = useDisclosure();
    const state = store.getState()
    const handleSelectionChange = (keys: any) => {
        setSelectedKey([keys.currentKey]);
    };
    const updateNoteSetting = async (key: string, value: any) => {
        let res = await UpdateNote(workspaceID, note.id, {
            [key]: value
        })
        if (res.code == responseCode.SUCCESS) {
            toast.success(t`Update successfully`);
            store.dispatch(UpdateNoteByID({ id: note.id, changes: { [key]: value } }))
        } else {
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

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" className="max-h-[715px] share-modal">
            <ModalContent >
                {() => (
                    <>
                        <ModalBody className="p-0">
                            <div className="flex h-full">
                                <Listbox disallowEmptySelection hideSelectedIcon={false} disabledKeys={disabledList} selectionMode="single" shouldHighlightOnFocus variant="flat" aria-label="Share Modal" className="w-56 h-full bg-slate-50 px-3 py-2" selectedKeys={selectedKey} onSelectionChange={handleSelectionChange}>
                                    <ListboxSection showDivider title={t`General`}>
                                        <ListboxItem key="management" startContent={<SquareIcon size={iconSize} />}>{t`Management`}</ListboxItem>
                                        <ListboxItem key="permission" startContent={<LockIcon size={iconSize} />}>{t`Permission`}</ListboxItem>
                                    </ListboxSection>
                                    <ListboxSection title={t`Share`} >
                                        <ListboxItem key="link" startContent={<LinkIcon size={iconSize} />} >{t`Invite Link`}</ListboxItem>
                                        <ListboxItem key="notion" startContent={<NotionIcon size={iconSize} />}>{t`Share Notion`}</ListboxItem>
                                        <ListboxItem key="wechat" startContent={<WechatIcon size={iconSize} />}>{t`Share Wechat`}</ListboxItem>
                                    </ListboxSection>
                                </Listbox>
                                <div className="flex-1 px-16 py-9 gap-4 flex flex-col">
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
                                    {selectedKey[0] == "notion" && (
                                        <div>
                                            notion
                                        </div>
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
        </Modal>
    )
}

function NoteSidebar() {
    return (
        <>
            <div>
                <Tabs size="sm">
                    <Tab className="w-8" title={<SparklesIcon className="h-4 w-4"></SparklesIcon>}>

                    </Tab>
                    <Tab className="w-8" title={<ChatBubbleLeftEllipsisIcon className="h-4 w-4"></ChatBubbleLeftEllipsisIcon>}>

                    </Tab>
                </Tabs>
            </div>
        </>
    )
}

export default function NotePage(props: NoteProps) {
    // const { t } = useLingui();
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const isLaptop = useMediaQuery({ minWidth: 768 });
    const [content, _] = useState<string>(props.note.content);
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
    const handleChangeContent = debounce((newContent: string) => {
        if (params.id == undefined) return;
        store.dispatch(UpdateNoteByID({ id: props.note.id, changes: { content: newContent } }))
        if (content != newContent) {
            // setSaving(true);
            AutoUpdateContent({
                content: newContent,
                workspace_id: params.id,
                note_id: props.note.id
            }).then((res) => {
                if (res.code == responseCode.SUCCESS) {
                    // setLastSaveTime(new Date().toLocaleTimeString());
                    // setSaving(false);
                } else {
                    // setSaving(false);
                }
            })
        }
    }, 500)

    const handleStarNote = async () => {
        SetFavoriteNoeRequest(props.note.id, !props.note.is_favorite)
        store.dispatch(UpdateNoteByID({ id: props.note.id, changes: { is_favorite: !props.note.is_favorite } }))
    }

    const handleBlurTitle = () => {
        setIsEditingTitle(false);
        store.dispatch(UpdateNoteByID({ id: props.note.id, changes: { title: inputRef.current ? inputRef.current.value : props.note.title } }))
    }

    return (
        <>
            <div className="flex h-full w-full">
                <div className="flex flex-1 w-min-0 w-full flex-col h-screen">
                    <div className="h-11 flex items-center justify-between px-4">
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
                                <SettingIcon></SettingIcon>
                            </Button>
                            <Button variant="light" isIconOnly size="sm" className="px-2" onPress={() => setOpenSide(!openSide)}>
                                <IconSidebar className="rotate-180"></IconSidebar>
                            </Button>
                            <NoteSettingModal isOpen={isOpenSetting} onOpenChange={onOpenSettingChange} note={props.note} workspaceID={params.id}></NoteSettingModal>
                        </div>
                    </div>
                    <div>
                        <div>

                        </div>
                    </div>
                    <div className="flex-1 whitespace-normal transition-all duration-300 min-w-0 flex p-4">
                        <BlockNoteEditor noteID={props.note.id} content={props.note.content} onChange={handleChangeContent} />

                    </div>
                </div>
                <div
                    className={`transition-all ${openSide ? "w-80 p-2 border-slate-200 border-l" : "w-0 p-0"} overflow-hidden   duration-300 h-full`}
                >
                    <NoteSidebar></NoteSidebar>
                </div>
            </div>
        </>
    )
}

