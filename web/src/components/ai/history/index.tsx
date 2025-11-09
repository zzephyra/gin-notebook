import { deleteAIHistorySessionRequest, getAIChatSessionRequest, getAIHistorySessionsRequest, updateAIHistorySessionRequest } from "@/features/api/ai";
import { useEffect, useRef, useState } from "react";
import {
    Listbox,
    ListboxItem,
    ModalContent,
    ModalHeader,
    ModalBody,
    Modal,
    Input,
} from "@heroui/react";
import { AIMessage, AISession } from "@/features/api/type";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import ChaseLoading from "../../loading/Chase/loading";
import { responseCode } from "@/features/constant/response";
import React from "react";
import { useLingui } from "@lingui/react/macro";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
const AIHistoryChats = ({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect?: (messages: AIMessage[], sessionID: string) => void }) => {
    const [chats, setChats] = useState<AISession[]>([]);
    const { t } = useLingui();
    var param = useParams();
    var workspace_id = param.id || '';
    const inputRef = useRef<HTMLInputElement>(null);
    const [loadingChats, setLoadingChats] = useState<string[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [editingSession, setEditingSession] = useState<string | null>(null);
    const [newSessionTitle, setNewSessionTitle] = useState("");
    useEffect(() => {
        if (!isOpen) {
            setChats([]);
            setTotal(0);
            setLoadingChats([]);
            return;
        };
        getAIHistorySessionsRequest(workspace_id).then((res) => {
            setChats(res.sessions || []);
            setTotal(res.total || 0);
        })
    }, [isOpen])

    async function handleDeleteSession(e: React.MouseEvent<SVGSVGElement, MouseEvent>, sessionId: string) {
        e.stopPropagation();
        setLoadingChats([...loadingChats, sessionId]);
        let res = await deleteAIHistorySessionRequest(sessionId, workspace_id)
        if (res.code == responseCode.SUCCESS) {
            toast.success(t`Session deleted successfully`);
            setChats(chats.filter(chat => chat.id !== sessionId));
        }
        setLoadingChats(loadingChats.filter(id => id !== sessionId));
    }

    const isEnd = React.useMemo(() => {
        return chats.length >= total;
    }, [chats, total]);

    async function loadSessions() {
        setLoading(true);
        let res = await getAIHistorySessionsRequest(workspace_id, chats.length)
        setChats([...chats, ...(res.sessions || [])]);
        setTotal(res.total || total);
        setLoading(false);
    }

    const strollToBottom = (e: React.UIEvent<HTMLDivElement> | undefined) => {
        if (!e) return;
        const target = e.currentTarget;
        const isBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
        if (isBottom && !isEnd) {
            loadSessions();
        }
    }

    const handleFocusInput = (e: React.MouseEvent<SVGSVGElement, MouseEvent>, id: string) => {
        e.stopPropagation();
        setEditingSession(id)
    }

    const blurInput = (id: string) => {
        const title = newSessionTitle.trim();
        updateAIHistorySessionRequest(id, workspace_id, { title: title }).then((res) => {
            if (res.code == responseCode.SUCCESS) {
                setChats(chats.map(chat => chat.id === id ? { ...chat, title: title } : chat));
                toast.success(t`Session updated successfully`);
            }
        })
        setEditingSession(null);
    }

    const handleSelectSession = async (sessionId: string) => {
        var res = await getAIChatSessionRequest(sessionId, workspace_id)
        if (res.code == responseCode.SUCCESS) {
            onClose();
            if (onSelect) {
                onSelect(res.data.messages, sessionId);
            }
        }
    }

    useEffect(() => {
        if (editingSession && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingSession]);

    return (
        <Modal isOpen={isOpen} scrollBehavior="inside" backdrop="blur" onClose={onClose}>
            <ModalContent>
                {() => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">{t`History Chats`}</ModalHeader>
                        <ModalBody onScroll={strollToBottom}>
                            <div className="flex flex-col gap-4">
                                <Listbox aria-label="ai history chats" className="w-full">
                                    {
                                        chats.flatMap((chat) => (
                                            <ListboxItem key={chat.id} onPress={() => handleSelectSession(chat.id)}>
                                                <div className="group h-7 flex items-center justify-between">
                                                    <div>
                                                        {
                                                            editingSession == chat.id ?
                                                                (
                                                                    <>
                                                                        <Input
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onKeyDown={(e) => {
                                                                                e.stopPropagation();
                                                                                if (e.key === "Enter") {
                                                                                    (e.target as HTMLInputElement).blur();
                                                                                }
                                                                            }} size="sm" onValueChange={setNewSessionTitle} onBlur={(e) => {
                                                                                e.stopPropagation();
                                                                                blurInput(chat.id)
                                                                            }} defaultValue={chat.title} ref={inputRef} />
                                                                    </>
                                                                ) : (
                                                                    <span className="text-sm text-zinc-700 group-hover:text-zinc-900">{chat.title || t`Untitled Session`}</span>
                                                                )
                                                        }
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {
                                                            loadingChats.includes(chat.id)
                                                                ? <ChaseLoading className="h-full" size={24} />
                                                                : <>
                                                                    <PencilSquareIcon className="cursor-pointer hidden group-hover:block text-zinc-500 hover:text-zinc-600 w-5" onClick={(e) => handleFocusInput(e, chat.id)} />
                                                                    <TrashIcon className="cursor-pointer hidden group-hover:block text-red-400 hover:text-red-500 w-5" onClick={(e) => handleDeleteSession(e, chat.id)} />
                                                                </>
                                                        }
                                                    </div>
                                                </div>
                                            </ListboxItem>
                                        )
                                        ).concat(
                                            loading ? [<ListboxItem isDisabled key="loading">
                                                <ChaseLoading className="h-7" size={24} />
                                            </ListboxItem>] : []
                                        )
                                    }
                                </Listbox>
                            </div >
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>

    );
}
export default AIHistoryChats;