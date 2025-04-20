import { NoteProps } from "./script";
import { useLingui } from "@lingui/react/macro";
import Tiptap from "@/components/third-party/tiptap";
import PlateEditor from "@/components/third-party/PlateEditor";
import { useMemo, useState } from "react";
import { debounce, List } from "lodash";
import { AutoUpdateContent, UpdateNote } from "@/features/api/note";
import { useParams } from "react-router-dom";
import { responseCode } from "@/features/constant/response";
import LoadingArrow from "../../icons/loading";
import { Button } from "@heroui/button";
import {
    Modal,
    ListboxSection,
    ModalContent,
    Listbox,
    ModalBody,
    ListboxItem,
    useDisclosure,
    Switch,
    Select,
    SelectItem,
    SharedSelection
} from "@heroui/react";
import { motion } from "motion/react";
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
import SquareIcon from "../../icons/square";
import { store } from "@/store";
import { UpdateNoteByID } from "@/store/features/workspace";
const iconSize = 14

function NoteSettingModal({ isOpen, onOpenChange, activeKey, note, workspaceID }: { isOpen: boolean, onOpenChange: (open: boolean) => void, activeKey?: string, note: Note, workspaceID: number }) {
    const { t } = useLingui();
    const [selectedKey, setSelectedKey] = useState([activeKey || "permission"]);
    const [noteState, setNoteState] = useState(note);
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
            setNoteState(prev => ({ ...prev, [key]: value }))
        } else {
            toast.error(res.error);

        }
    }

    const disabledList = useMemo(() => {
        let list = [];
        if (!noteState.allow_share) {
            list.push("link", "notion", "wechat");
        }
        return list;
    }, [noteState.allow_share, noteState.allow_invite]);

    const switchNoteCategory = async (key: SharedSelection) => {
        let category_id = Number(key.currentKey);
        let res = await UpdateNote(workspaceID, note.id, {
            category_id: category_id
        })
        if (res.code == responseCode.SUCCESS) {
            store.dispatch(UpdateNoteByID({ id: note.id, data: { category_id: category_id } }))
            toast.success(t`Update successfully`);
        } else {
            toast.error(res.error);
        }
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" className="max-h-[715px] share-modal">
            <ModalContent >
                {(onClose) => (
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
                                                    <div className="text-slate-500">{noteState.id}</div>
                                                </SettingsItem>
                                                <SettingsItem label={t`Category`} description={t`Categorize the note by selecting an existing note category.`}>
                                                    <Select size="sm" defaultSelectedKeys={[String(noteState.category_id)]} className="w-32" onSelectionChange={switchNoteCategory} >
                                                        {state.workspace.categoryList.map((category) => (
                                                            <SelectItem key={category.id} className="text-slate-500">{category.category_name || t`No Category`}</SelectItem>
                                                        ))}
                                                    </Select>
                                                </SettingsItem>
                                            </SettingsWrapper>
                                            <SettingsWrapper title={t`Note Settings`}>
                                                <SettingsItem label={t`Enable Share`} description={t`Allow sharing this note with others or third-party applications.`} >
                                                    <Switch defaultSelected={noteState.allow_share} onValueChange={(value) => updateNoteSetting("allow_share", value)} />
                                                </SettingsItem>
                                                <SettingsItem label={t`Enable Share`} description={t`Allow sharing this note with others or third-party applications.`} >
                                                    <Switch defaultSelected={noteState.allow_share} onValueChange={(value) => updateNoteSetting("allow_share", value)} />
                                                </SettingsItem>
                                            </SettingsWrapper>
                                        </>
                                    )}
                                    {selectedKey[0] == "permission" && (
                                        <SettingsWrapper title={t`Permission`}>
                                            <SettingsItem label={t`Note Status`} description={t`Set the current note's status. When set to private, it will be invisible to others.`}>
                                                <Select size="sm" defaultSelectedKeys={[noteState.status]} className="w-32" onSelectionChange={(key) => updateNoteSetting("status", key.currentKey)}>
                                                    <SelectItem key="public">{t`Public`}</SelectItem>
                                                    <SelectItem key="privite">{t`Privite`}</SelectItem>
                                                </Select>
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

export default function NotePage(props: NoteProps) {
    const { t } = useLingui();
    const [content, setContent] = useState<string>(props.note.content);
    const params = useParams();
    const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { isOpen: isOpenSetting, onOpen: onOpenSetting, onOpenChange: onOpenSettingChange } = useDisclosure();

    const handleChangeContent = debounce((newContent: string) => {
        setContent(newContent);
        if (content != newContent) {
            setSaving(true);
            AutoUpdateContent({
                content: newContent,
                workspace_id: Number(params.id),
                note_id: props.note.id
            }).then((res) => {
                if (res.code == responseCode.SUCCESS) {
                    setLastSaveTime(new Date().toLocaleTimeString());
                    setSaving(false);
                } else {
                    setSaving(false);
                    setError(res.error);
                }
            })
        }

    }, 500)


    return (
        <>
            <div className="flex flex-col h-screen">
                <div className="h-11 flex items-center justify-between px-4">

                    <div>
                        {saving ?
                            <motion.div
                                key="saving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <div className="flex items-center gap-2">
                                    <LoadingArrow size={14} className="animate-spin"></LoadingArrow>
                                    <span>
                                        {t`Auto-saving...`}
                                    </span>
                                </div>
                            </motion.div> :
                            lastSaveTime &&
                            <motion.div
                                key="saved"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="">
                                    {t`Last saved at ${lastSaveTime}`}
                                </div>
                            </motion.div>
                        }
                    </div>
                    <div>
                        {props.note.title}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="light" isIconOnly size="sm" className="px-2" onPress={onOpenSetting}>
                            <ShareIcon></ShareIcon>
                        </Button>
                        <Button variant="light" isIconOnly size="sm" className="px-2" onPress={onOpenSetting}>
                            <SettingIcon></SettingIcon>
                        </Button>
                        <NoteSettingModal isOpen={isOpenSetting} onOpenChange={onOpenSettingChange} note={props.note} workspaceID={Number(params.id)}></NoteSettingModal>
                    </div>
                </div>
                <div>
                    <div>

                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <PlateEditor value={content} onValueChange={handleChangeContent}></PlateEditor>
                    {/* <Tiptap content={content} onChangeContent={handleChangeContent}></Tiptap> */}
                </div>
            </div>
        </>
    )
}

