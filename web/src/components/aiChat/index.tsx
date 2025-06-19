import { RootState } from '@/store';
import { Chat, MarkdownRender } from '@douyinfe/semi-ui';
import "./style.css"
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { Message, RenderActionProps, RenderContentProps } from '@douyinfe/semi-ui/lib/es/chat/interface';
import { createAIMessage, getAIChatApi, getAIChatSessionRequest } from '@/features/api/ai';
import AIChatInput from '../aiChatInput';
import { Button } from '@heroui/button';
import { ClockIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import AvatarMenu from '../avatarMenu';
import { useMediaQuery } from 'react-responsive';
import { Square2StackIcon } from '@heroicons/react/24/outline';
import { FolderIcon } from '@heroicons/react/24/outline';
import FolderDrawer from '../drower/folderDrower';
import {
    Avatar, AvatarGroup,
    useDisclosure,
} from '@heroui/react';
import { useLingui } from '@lingui/react/macro';
import AIChatToolset from '../aiChatToolset';
import { responseCode } from '@/features/constant/response';
import AIHistoryChats from '../aiHistoryChats';
import { AIMessage } from '@/features/api/type';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SourceCard = (props: any) => {
    const [open, setOpen] = useState(true);
    const [_, setShow] = useState(false);
    const { source } = props;
    const onOpen = useCallback(() => {
        setOpen(false);
        setShow(true);
    }, []);

    const onClose = useCallback(() => {
        setOpen(true);
        setTimeout(() => {
            setShow(false);
        }, 350)
    }, []);

    const openReferenceWeb = (event: React.MouseEvent, url: string) => {
        event.stopPropagation();
        window.open(url, '_blank');
    }

    return (<div style={{
        transition: open ? 'height 0.4s ease, width 0.4s ease' : 'height 0.4s ease',
        height: open ? '40px' : '200px',
        width: open ? '220px' : '100%',
        background: 'var(--semi-color-tertiary-light-hover)',
        borderRadius: 16,
        boxSizing: 'border-box',
        marginBottom: 10,
    }}
    >
        <span
            // ref={spanRef}
            className='cursor-pointer'
            style={{
                display: !open ? 'none' : 'flex',
                width: 'fit-content',
                columnGap: 10,
                background: 'var(--semi-color-tertiary-light-hover)',
                borderRadius: '16px',
                padding: '5px 10px',
                fontSize: 14,
                color: 'var(--semi-color-text-1)',
            }}
            onClick={onOpen}
        >
            <span>基于{source.length}个搜索来源</span>
            <AvatarGroup size="sm" >
                {source.map((s: any, index: number) => (<Avatar key={index} src={s.avatar || "https://cdn.mameos.cn/referenceAvatar.jpeg"}></Avatar>))}
            </AvatarGroup>
        </span>
        <span
            style={{
                height: '100%',
                boxSizing: 'border-box',
                display: !open ? 'flex' : 'none',
                flexDirection: 'column',
                background: 'var(--semi-color-tertiary-light-hover)', borderRadius: '16px', padding: 12
            }}
            className='box-border cursor-pointer'
            onClick={onClose}
        >
            <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 10px', columnGap: 10, color: 'var(--semi-color-text-1)'
            }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Source</span>
                {/* <IconChevronUp /> */}
            </span>
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 10, overflow: 'scroll', padding: '5px 10px' }}>
                {source.map((s: any) => (
                    <span style={{
                        display: 'flex',
                        flexDirection: 'column',
                        rowGap: 5,
                        flexBasis: 150,
                        flexGrow: 1,
                        border: "1px solid var(--semi-color-border)",
                        borderRadius: 12,
                        padding: 12,
                        fontSize: 12
                    }}
                        className="cursor-pointer"
                        onClick={(event) => openReferenceWeb(event, s.url)}
                    >
                        <span style={{ display: 'flex', columnGap: 5, alignItems: 'center', }}>
                            <Avatar style={{ width: 16, height: 16, flexShrink: 0 }} src={s.avatar || "https://cdn.mameos.cn/referenceAvatar.jpeg"} />
                            <span style={{ color: 'var(--semi-color-text-2)', textOverflow: 'ellipsis' }}>{s.title}</span>
                        </span>
                        <span style={{
                            color: 'var(--semi-color-primary)',
                            fontSize: 12,
                        }}
                        >{s.summary}</span>
                        <span style={{
                            display: '-webkit-box',
                            // "-webkit-box-orient": 'vertical',
                            WebkitLineClamp: '3',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            color: 'var(--semi-color-text-2)',
                        }}>{s.content}</span>
                    </span>))}
            </span>
        </span>
    </div>
    )
}

const AIChat = ({ isCollapsed, setCollapsed }: { isCollapsed?: boolean, setCollapsed?: (value: boolean) => void }) => {
    var user = useSelector((state: RootState) => state.user);
    var { t } = useLingui();
    var [chatMessages, setChatMessages] = useState<Message[]>([]);
    var controller = useRef(new AbortController());
    const { isOpen: isOpenFolderDrawer, onOpen: onOpenFolderDrawer, onOpenChange: onOpenChangeFolderDrawer } = useDisclosure();
    const [sessionID, setSessionID] = useState<string | undefined>();  // 会话ID
    const [mode] = useState<"bubble" | "noBubble" | "userBubble">('bubble');
    const [align] = useState<'leftRight' | 'leftAlign'>('leftRight');
    const showChat = useMemo(() => chatMessages.length != 0, [chatMessages.length]);
    const onChatsChange = useCallback((chats: any) => {
        setChatMessages(chats);
    }, []);
    const navigate = useNavigate();
    const location = useLocation();
    const [isSearchInternet, setIsSearchInternet] = useState(false);  // 是否搜索互联网
    const { isOpen: isOpenHistoryChats, onOpen: onOpenHistoryChats, onClose: onCloseHistoryChats } = useDisclosure();

    const isProcessing = useMemo(() => {
        var status = chatMessages[chatMessages.length - 1]?.status
        var role = chatMessages[chatMessages.length - 1]?.role;
        return role == "assistant" && controller.current && !controller.current.signal.aborted && (status === 'loading' || status === 'incomplete');
    }, [chatMessages]);  // 判断当前是否正在处理消息

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);

        if (sessionID) {
            searchParams.set("sessionID", String(sessionID));
        } else {
            searchParams.delete("sessionID");
        }

        navigate(`${location.pathname}?${searchParams.toString()}`, {
            replace: true,
        });
    }, [sessionID]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        console.log("location.search", location.search);
        const sessionIDFromUrl = searchParams.get("sessionID");
        if (sessionIDFromUrl) {
            setSessionID(sessionIDFromUrl);
            getAIChatSessionRequest(sessionIDFromUrl).then((res) => {
                if (res?.code == responseCode.SUCCESS) {
                    setChatMessages(res.data.messages.map(
                        (msg: AIMessage) => ({
                            id: msg.id,
                            role: msg.role,
                            content: msg.content,
                            status: msg.status || 'complete',
                            createAt: new Date(msg.created_at).getTime() || Date.now(),
                            references: msg.references || null,
                        })
                    ));
                } else {
                    toast.error(t`Failed to load chat history`);
                }
            })
        }
    }, []);

    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const onMessageSend = async (content: any) => {
        controller.current = new AbortController();
        setChatMessages((message) => {
            return [
                ...message,
                {
                    role: 'assistant',
                    status: 'loading',
                    createAt: Date.now(),
                    id: uuidv4(),
                }
            ]
        });
        var tempSessionID = sessionID;
        if (sessionID === undefined) {
            let res = await createAIMessage(content, "init", "complete", "user", sessionID)
            if (res?.code == responseCode.SUCCESS) {
                if (res.data.session_id) {
                    setSessionID(res.data.session_id)
                    tempSessionID = res.data.session_id;
                };
            }
        } else {
            createAIMessage(content, "insert", "complete", "user", sessionID)
        }

        let newMessage: Message = {
            status: 'loading',
        }

        try {
            var resp = await getAIChatApi([{
                role: 'user',
                id: '1',
                createAt: new Date().getTime(),
                content: content,
            }], controller.current, { isSearchInternet: isSearchInternet })
            var reader = resp.data?.getReader();
            const decoder = new TextDecoder("utf-8");
            let aiMessage = "";

            if (!reader) {
                setChatMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].status = 'error';
                    updated[updated.length - 1].content = t`Failed to get response from AI`;
                    return updated;
                })
                return
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                chunk.split("\n").forEach(line => {
                    if (line.startsWith("data: ")) {
                        const content = line.replace(/^data: /, "");
                        if (content === "[DONE]") {
                            return;
                        }
                        var parsedData: any = JSON.parse(content);
                        aiMessage += parsedData.choices[0].delta.content || '';
                        setChatMessages(prev => {
                            const updated = [...prev];
                            const lastMessage = updated[updated.length - 1];
                            newMessage = { ...lastMessage };
                            if (lastMessage.status === 'loading') {
                                newMessage = {
                                    ...newMessage,
                                    content: aiMessage,
                                    status: 'incomplete'
                                }
                            }
                            else if (lastMessage.status === 'incomplete') {
                                newMessage = {
                                    ...newMessage,
                                    content: aiMessage
                                }
                            }

                            if (parsedData.references) {
                                newMessage.references = parsedData.references;
                            }

                            if (parsedData.choices?.[0]?.finish_reason === "stop") {
                                newMessage.status = 'complete';
                            }
                            return [...updated.splice(0, updated.length - 1), newMessage];
                        });
                    }
                });
            }
        } catch (error) {
            setChatMessages(prev => {
                const updated = [...prev];
                const lastMessage = updated[updated.length - 1];
                newMessage = { ...lastMessage };
                newMessage = {
                    ...newMessage,
                    content: t`Oops, something went wrong!`,
                    status: 'error'
                }
                return [...updated.splice(0, updated.length - 1), newMessage];
            }
            )
        }
        createAIMessage(String(newMessage.content), "insert", newMessage?.status || "complete", "assistant", sessionID || tempSessionID)
    };

    const renderContent = useCallback((props: RenderContentProps) => {
        const { message, className, defaultContent } = props;
        return <div className={className}>
            {
                message?.status == "loading" ? (
                    defaultContent
                ) : (
                    <>
                        {
                            message?.role == "assistant" && message.references &&
                            (
                                <SourceCard source={message.references} />
                            )
                        }
                        < MarkdownRender raw={message?.content || ""} />
                    </>
                )
            }
        </div>
    }, []);

    const chatToolset = useCallback((props: RenderActionProps) => {
        return <AIChatToolset props={props} />
    }, []);

    const onStopGenerator = () => {
        controller.current.abort();
        setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].status = 'complete';
            return updated;
        });
    };

    const handleCloseCollapse = () => {
        if (setCollapsed) {
            setCollapsed(!isCollapsed);
        }
    }

    const emptyMessages = () => {
        setChatMessages([]);
        setSessionID(undefined);
    }
    const roleInfo = {
        user: {
            name: user.nickname || user.email,
            avatar: user.avatar
        },
        assistant: {
            name: t`Mameos Robot`,
            avatar: 'https://cdn.mameos.cn/assistantAvatar.jpeg'
        },
        system: {
            name: 'System',
            avatar: 'https://cdn.mameos.cn/assistantAvatar.jpeg'
        }
    }

    const LoadHistoryMessage = (messages: AIMessage[], sessionID: string) => {
        setChatMessages(messages.map(
            (msg) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                status: msg.status || 'complete',
                createAt: new Date(msg.created_at).getTime() || Date.now(),
                // references: msg.references || [],
            })
        ))
        setSessionID(sessionID);
    }

    return (
        <>
            <div className='p-2 '>
                <div className='flex items-center justify-between'>
                    <div className='flex'>
                        {
                            isDesktop ?
                                (
                                    <Button isIconOnly radius='full' size='sm' variant="light" onPress={handleCloseCollapse} >
                                        <ViewColumnsIcon className='w-6' />
                                    </Button>
                                ) : (
                                    <AvatarMenu>
                                    </AvatarMenu>
                                )
                        }
                    </div>
                    <div className='flex'>
                        <Button className='group gap-px px-2 min-w-0' radius='full' size='sm' variant="light" onPress={emptyMessages}>
                            <Square2StackIcon className='w-6' />
                            <span className='max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[300px] transition-all text-xs text-gray-500'>{t`New Chat`}</span>
                        </Button>
                        <Button className='group gap-px px-2 min-w-0' radius='full' size='sm' variant="light" onPress={onOpenHistoryChats}>
                            <ClockIcon className='w-6' />
                            <span className='max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[300px] transition-all text-xs text-gray-500'>{t`History`}</span>
                        </Button>
                        {
                            isDesktop ? (<></>) : (
                                <>
                                    <Button className='group gap-px px-2 min-w-0' radius='full' size='sm' variant="light" onPress={onOpenFolderDrawer}>
                                        <FolderIcon className='w-6' />
                                        <span className='max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[300px] transition-all text-xs text-gray-500'>{t`Notes`}</span>
                                    </Button>
                                    <FolderDrawer isOpen={isOpenFolderDrawer} onOpenChange={onOpenChangeFolderDrawer}>
                                    </FolderDrawer>
                                </>
                            )
                        }
                    </div>
                </div>
            </div>
            <AIHistoryChats onSelect={LoadHistoryMessage} isOpen={isOpenHistoryChats} onClose={onCloseHistoryChats} />
            <Chat
                key={align + mode}
                align={align}
                mode={mode}
                className={`w-full !max-w-full ai-chat ${showChat ? "" : 'hide-chat'}`}
                // uploadProps={uploadProps}
                renderInputArea={
                    (props) => <AIChatInput onStop={onStopGenerator} onSeachChange={setIsSearchInternet} isProcessing={isProcessing} hidePrologue={!showChat} user={user} props={props} />
                }
                chatBoxRenderConfig={{
                    renderChatBoxAction: chatToolset,
                    renderChatBoxContent: renderContent,
                }}
                chats={chatMessages}
                roleConfig={roleInfo}
                onChatsChange={onChatsChange}
                onStopGenerator={onStopGenerator}
                onMessageSend={onMessageSend}
            />
        </>
    );
}

export default AIChat;