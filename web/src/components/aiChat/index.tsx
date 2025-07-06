import { RootState } from '@/store';
import { Chat, MarkdownRender } from '@douyinfe/semi-ui';
import "./style.css"
import { useCallback, useMemo, useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { Message, RenderActionProps, RenderContentProps } from '@douyinfe/semi-ui/lib/es/chat/interface';
import { createAIMessage, getAIChatApi, getAIChatSessionRequest, updateAIMessage } from '@/features/api/ai';
import AIChatInput from '../aiChatInput';
import {
    Avatar, AvatarGroup,
} from '@heroui/react';
import { useLingui } from '@lingui/react/macro';
import AIChatToolset from '../aiChatToolset';
import { responseCode } from '@/features/constant/response';
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

type AIChatProps = {
    isCollapsed: boolean,
    setCollapsed: (value: boolean) => void,
}

export type AIChatRef = {
    updateSessionID: (sessionID: string | undefined) => void,
    newSession: () => void,
    setMessages: (messages: Message[]) => void,
}

const AIChat = forwardRef<AIChatRef, AIChatProps>((_, ref) => {
    var user = useSelector((state: RootState) => state.user);
    var { t } = useLingui();
    var [chatMessages, setChatMessages] = useState<Message[]>([]);
    var controller = useRef(new AbortController());
    const [sessionID, setSessionID] = useState<string | undefined>();  // 会话ID
    const [mode] = useState<"bubble" | "noBubble" | "userBubble">('bubble');
    const [align] = useState<'leftRight' | 'leftAlign'>('leftRight');
    const showChat = useMemo(() => chatMessages.length != 0, [chatMessages.length]);
    const navigate = useNavigate();
    const location = useLocation();
    const [isSearchInternet, setIsSearchInternet] = useState(false);  // 是否搜索互联网
    const latestMessageID = useRef<string | undefined>(undefined);  // 最新消息ID，用于更新消息状态
    const isProcessing = useMemo(() => {
        var status = chatMessages[chatMessages.length - 1]?.status
        var role = chatMessages[chatMessages.length - 1]?.role;
        return role == "assistant" && controller.current && !controller.current.signal.aborted && (status === 'loading' || status === 'incomplete');
    }, [chatMessages]);  // 判断当前是否正在处理消息
    const onChatsChange = useCallback((chats: any) => {
        latestMessageID.current = chats[chats.length - 1]?.id;
        setChatMessages(chats);
    }, []);
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

    useImperativeHandle(ref, () => ({
        newSession: () => {
            setSessionID(undefined);
            setChatMessages([]);
        },
        updateSessionID: setSessionID,
        setMessages: setChatMessages
    }));

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
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
                            parentId: msg.parent_id || undefined,
                        })
                    ));
                } else {
                    toast.error(t`Failed to load chat history`);
                }
            })
        }
    }, []);

    const requestAIResponse = async ({
        userMessage,
        controller,
        isSearchInternet,
        onStreamUpdate,
        onFinish,
        onError,
        onAbort,
    }: {
        userMessage: string,
        controller: AbortController,
        isSearchInternet: boolean,
        onStreamUpdate: (content: string, extra?: any) => void,
        onFinish: (finalContent: string, extra?: any) => void,
        onError: () => void,
        onAbort?: () => void,
    }) => {
        let aiMessage = "";
        try {
            const resp = await getAIChatApi([
                {
                    role: 'user',
                    id: '1',
                    createAt: new Date().getTime(),
                    content: userMessage,
                }
            ], controller, { isSearchInternet });

            const reader = resp.data?.getReader();
            const decoder = new TextDecoder("utf-8");


            if (!reader) {
                onError();
                return;
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                chunk.split("\n").forEach(line => {
                    if (line.startsWith("data: ")) {
                        const content = line.replace(/^data: /, "");
                        if (content === "[DONE]") return;
                        const parsed = JSON.parse(content);
                        aiMessage += parsed.choices?.[0]?.delta?.content || '';
                        onStreamUpdate(aiMessage, parsed);
                    }
                });
            }
        } catch (e: any) {
            if (e.name === 'AbortError') {
                onAbort?.();
            } else {
                onError();
            }
        } finally {
            onFinish(aiMessage, {});
        }
    };

    const updateLastMessage = (data: Partial<Message>) => {
        setChatMessages(prev => {
            const updated = [...prev];
            const last = updated.at(-1)!;
            var newMessage = {
                ...last,
                ...data
            };
            return [...updated.slice(0, -1), newMessage];
        });
    }



    const onMessageSend = async (content: string) => {
        controller.current = new AbortController();
        const res = await createAIMessage(content, sessionID ? "insert" : "init", "complete", "user", sessionID);
        const tempSessionID = res.data.session_id;
        setSessionID(tempSessionID);
        const parentID = res.data.message_id;
        updateMessageByID(latestMessageID.current, { id: parentID })
        // 插入临时 assistant 消息
        setChatMessages(prev => [...prev, {
            role: 'assistant',
            status: 'loading',
            createAt: Date.now(),
            parentId: parentID,
            id: uuidv4()
        }]);

        await requestAIResponse({
            userMessage: content,
            controller: controller.current,
            isSearchInternet,
            onStreamUpdate: (msg, parsed) => {
                var data: Message = {
                    content: msg,
                    status: parsed.choices?.[0]?.finish_reason === "stop" ? "complete" : "incomplete",
                }

                if (parsed.references) {
                    data.references = parsed.references;
                }
                updateLastMessage(data)
            },
            onFinish: async (msg) => {
                // 完成后创建 AI 消息
                let latestMessage = chatMessages[chatMessages.length - 1];
                const result = await createAIMessage(
                    msg, "insert", latestMessage?.status || "complete", "assistant", tempSessionID, parentID
                );
                if (result.code === responseCode.SUCCESS) {
                    updateLastMessage({ id: result.data.message_id })
                }
            },
            onError: () => {
                updateLastMessage({
                    content: t`Oops, something went wrong!`,
                    status: 'error'
                })
            }
        });
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
        setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1].status = 'complete';
            return updated;
        });
        controller.current.abort();
    };

    const updateMessageByID = (id: string | undefined, data: Partial<Message>) => {
        if (!id) {
            return;
        }

        setChatMessages((prev) => {
            return prev.map((msg) => {
                if (msg.id === id) {
                    return { ...msg, ...data };
                }
                return msg;
            });
        });
    }

    const getMessageByID = (id: string) => {
        return chatMessages.find((msg) => msg.id === id);
    }

    const handleReloadMessage = async (message: Message | undefined) => {
        if (!message?.parentId) {
            toast.error(t`Cannot reload message that has a parent message.`);
            if (message?.id) {
                updateMessageByID(message.id, {
                    status: 'complete',
                })
            }
            return;
        }
        const parentMessage = getMessageByID(message.parentId);
        if (!parentMessage) {
            toast.error(t`Parent message not found.`);
            updateMessageByID(message?.id, {
                status: 'complete',
            })
            return;
        }

        var newMessage: Message = {
            ...message,
            content: '',
        }
        await requestAIResponse({
            userMessage: String(message.content),
            controller: controller.current,
            isSearchInternet,
            onStreamUpdate: (msg, parsed) => {
                setChatMessages(prev => {
                    const updated = [...prev];
                    const last = updated.at(-1)!;
                    newMessage = {
                        ...last,
                        content: msg,
                        status: parsed.choices?.[0]?.finish_reason === "stop" ? "complete" : "incomplete",
                        references: parsed.references ?? last.references,
                    };
                    return [...updated.slice(0, -1), newMessage];
                });
            },
            onFinish: async (msg) => {
                // 完成后创建 AI 消息
                let latestMessage = chatMessages[chatMessages.length - 1];
                await updateAIMessage(msg, "reset", latestMessage?.status || "complete", "assistant", message?.id, sessionID);
            },
            onError: () => {
                setChatMessages(prev => {
                    console.error("Error while reloading message", message);
                    const updated = [...prev];
                    const last = updated.at(-1)!;
                    return [...updated.slice(0, -1), {
                        ...last,
                        content: t`Oops, something went wrong!`,
                        status: 'error'
                    }];
                });
            }
        });
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

    return (
        <>
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
                onMessageReset={handleReloadMessage}
            />
        </>
    );
})

export default AIChat;