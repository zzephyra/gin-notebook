import { RootState } from '@/store';
import { Chat } from '@douyinfe/semi-ui';
import "./style.css"
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@douyinfe/semi-ui/lib/es/chat/interface';
import { getAIChatApi } from '@/features/api/ai';
import AIChatInput from '../aiChatInput';
import { Button } from '@heroui/button';
import { ViewColumnsIcon } from '@heroicons/react/24/outline';
import AvatarMenu from '../avatarMenu';
import { useMediaQuery } from 'react-responsive';
import { Square2StackIcon } from '@heroicons/react/24/outline';
import { FolderIcon } from '@heroicons/react/24/outline';
import FolderDrawer from '../drower/folderDrower';
import { useDisclosure } from '@heroui/react';


const AIChat = ({ isCollapsed, setCollapsed }: { isCollapsed?: boolean, setCollapsed?: (value: boolean) => void }) => {
    var user = useSelector((state: RootState) => state.user);
    var [chatMessages, setChatMessages] = useState<Message[]>([]);
    var controller = new AbortController();
    const { isOpen: isOpenFolderDrawer, onOpen: onOpenFolderDrawer, onOpenChange: onOpenChangeFolderDrawer } = useDisclosure();

    const [mode] = useState<"bubble" | "noBubble" | "userBubble">('bubble');
    const [align] = useState<'leftRight' | 'leftAlign'>('leftRight');
    const showChat = useMemo(() => chatMessages.length != 0, [chatMessages.length]);
    const onChatsChange = useCallback((chats: any) => {
        setChatMessages(chats);
    }, []);
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const onMessageSend = useCallback(async (content: any) => {
        // var oldMessages = 
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
        var resp = await getAIChatApi([{
            role: 'user',
            id: '1',
            createAt: new Date().getTime(),
            content: content,
        }], controller)
        var reader = resp.data?.getReader();
        const decoder = new TextDecoder("utf-8");
        let aiMessage = "";

        if (!reader) return;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            chunk.split("\n").forEach(line => {
                if (line.startsWith("data: ")) {
                    const content = line.replace(/^data: /, "");
                    var parsedData: any = JSON.parse(content);
                    aiMessage += parsedData.choices[0].delta.content || '';
                    setChatMessages(prev => {
                        const updated = [...prev];
                        const lastMessage = updated[updated.length - 1];
                        let newMessage = { ...lastMessage };
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
                        return [...updated.splice(0, updated.length - 1), newMessage];
                    });
                }
            });
        }
    }, []);

    const onSendMessageCallback = () => {
    }

    const handleCloseCollapse = () => {
        if (setCollapsed) {
            setCollapsed(!isCollapsed);
        }
    }

    const emptyMessages = () => {
        setChatMessages([]);
    }

    const roleInfo = {
        user: {
            name: user.nickname || user.email,
            avatar: user.avatar
        },
        assistant: {
            name: 'Assistant',
            avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png'
        },
        system: {
            name: 'System',
            avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/other/logo.png'
        }
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
                    <div className='flex gap-2'>
                        <Button isIconOnly radius='full' size='sm' variant="light" onPress={emptyMessages}>
                            <Square2StackIcon className='w-6' />
                        </Button>
                        {
                            isDesktop ? (<></>) : (
                                <>
                                    <Button isIconOnly radius='full' size='sm' variant="light" onPress={onOpenFolderDrawer}>
                                        <FolderIcon className='w-6' />
                                    </Button>
                                    <FolderDrawer isOpen={isOpenFolderDrawer} onOpenChange={onOpenChangeFolderDrawer}>
                                    </FolderDrawer>
                                </>
                            )
                        }
                    </div>
                </div>
            </div>
            <Chat
                key={align + mode}
                align={align}
                mode={mode}
                className={`w-full !max-w-full ai-chat ${showChat ? "" : 'hide-chat'}`}
                // uploadProps={uploadProps}
                renderInputArea={
                    (props) => <AIChatInput hidePrologue={!showChat} user={user} onSendMessage={onSendMessageCallback} props={props} />
                }
                chats={chatMessages}
                roleConfig={roleInfo}
                onChatsChange={onChatsChange}
                onMessageSend={onMessageSend}
            />
        </>
    );
}

export default AIChat;