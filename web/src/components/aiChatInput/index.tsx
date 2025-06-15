import { Textarea } from '@heroui/input';
import { LinkSlashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/button';
import { i18n } from '@lingui/core';
import { RenderInputAreaProps } from '@douyinfe/semi-ui/lib/es/chat/interface';
import { UserState } from '@/store/features/user';
import "./style.css"
import { useState, useRef, useEffect, useMemo } from 'react';
import { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import toast from 'react-hot-toast';

const Prologues = [
    "Hello, {username}, how's your day going today?",
    "Hi {username}, what can I assist you with today?",
    "Hey {username}, what brilliant ideas are we exploring today?",
    "Welcome back, {username}! Glad to be working with you again today."
]

const AIChatInput = ({ user, props, onSendMessage, className, hidePrologue }: { user: UserState, className?: string, props?: RenderInputAreaProps | undefined, onSendMessage?: (message: string) => void, hidePrologue: boolean }) => {
    // const [hidePrologue, sethidePrologue] = useState(true);
    const prologueRef = useRef<HTMLDivElement>(null);

    const [messageContent, setMessageContent] = useState("");
    const [files] = useState<FileItem[]>([]);
    const randomIndex = useMemo(() => Math.floor(Math.random() * Prologues.length), []);
    const handleSendMessage = (content: string) => {
        if (!content || content.trim() === "") {
            toast.error(i18n._("Please enter a message before sending."));
            return;
        }

        // if (hidePrologue) {
        //     sethidePrologue(false);
        // }

        if (onSendMessage) {
            onSendMessage(content);
        }

        if (props && props.onSend) {
            props?.onSend(content, files);
        }

        setMessageContent("");
    }

    useEffect(() => {
        if (prologueRef.current) {
            prologueRef.current.style.setProperty("--characters", Prologues[randomIndex].length.toString());
        }
    }, [randomIndex]);

    return (
        <>
            <div className={`flex-col flex-1 transition-all ease-in-out flex items-center justify-center ${className || ""}`}>
                {hidePrologue && (
                    <>
                        <div className='text-xl'>
                            <h1 ref={prologueRef} className='typing font-semibold mb-6 mx-auto'>
                                {i18n._(Prologues[randomIndex], { username: user.nickname || user.email })}
                            </h1>
                        </div>
                    </>
                )}
                <div className={`${hidePrologue ? "w-11/12 md:w-10/12 lg:w-[36rem]" : "w-10/12"} transition-all ease-in-out duration-200  bg-gray-100 m-2 p-2 mx-4 rounded-3xl`}>
                    <Textarea value={messageContent} classNames={{ inputWrapper: "shadow-none" }} onValueChange={setMessageContent} />
                    <div className='flex items-center justify-between mt-2'>
                        <div>
                            <Button size='sm' isIconOnly variant="light" className='!rounded-full !p-2 hover:!bg-gray-200'>
                                <LinkSlashIcon className='w-4' />
                            </Button>
                        </div>
                        <div>
                            <Button isDisabled={messageContent == ""} size='sm' color='primary' isIconOnly className='!rounded-full !p-2 ' onPress={() => handleSendMessage(messageContent)}>
                                <PaperAirplaneIcon className='w-4' />
                            </Button>
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}

export default AIChatInput;