import { Textarea } from '@heroui/input';
import { GlobeAltIcon, LinkSlashIcon, PaperAirplaneIcon, PauseIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/button';
import { RenderInputAreaProps } from '@douyinfe/semi-ui/lib/es/chat/interface';
import { UserState } from '@/store/features/user';
import "./style.css"
import { useState, useRef, useEffect, useMemo } from 'react';
import { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import toast from 'react-hot-toast';
import { useLingui } from '@lingui/react/macro';
import { t } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { TypeAnimation } from 'react-type-animation';
import AIConfig from '@/config/ai';
import { tv, useCheckbox, Chip, VisuallyHidden } from '@heroui/react';
const Prologues = [
    (username: string) =>
        i18n._(t`Hello, ${username}, how's your day going today?`),

    (username: string) =>
        i18n._(t`Hi ${username}, what can I assist you with today?`),

    (username: string) =>
        i18n._(t`Hey ${username}, what brilliant ideas are we exploring today?`),

    (username: string) =>
        i18n._(
            t`Welcome back, ${username}! Glad to be working with you again today.`
        ),
];
const CURSOR_CLASS_NAME = 'remove-type-animation-cursor';


const SearchInternetButton = ({ onSelelctChange }: { onSelelctChange?: (isSelected: boolean) => void }) => {
    const { isSelected, isFocusVisible, getBaseProps, getInputProps } =
        useCheckbox({
            defaultSelected: false,
        });

    const checkbox = tv({
        slots: {
            base: "border-[0.75px] border-default hover:bg-default-200",
            content: " p-1 gap-1 flex justify-center items-center text-default-500",
        },
        variants: {
            isSelected: {
                true: {
                    base: "border-primary bg-primary hover:bg-primary-500 hover:border-primary-500",
                    content: "text-primary-foreground",
                },
            },
            isFocusVisible: {
                true: {
                    base: "outline-none ring-2 ring-focus ring-offset-2 ring-offset-background",
                },
            },
        },
    });
    const styles = checkbox({ isSelected, isFocusVisible });
    useEffect(() => {
        if (onSelelctChange) {
            onSelelctChange(isSelected);
        }
    }, [isSelected, onSelelctChange]);

    return (
        <>
            <label {...getBaseProps()}>
                <VisuallyHidden>
                    <input {...getInputProps()} />
                </VisuallyHidden>
                <Chip
                    classNames={{
                        base: styles.base(),
                        content: styles.content(),
                    }}
                    color="primary"
                    variant="faded"
                >
                    <GlobeAltIcon className='w-4 h-4' />
                    <span>
                        {i18n._(t`Search`)}
                    </span>
                </Chip>
            </label>
        </>
    )
}

const AIChatInput = ({ user, props, onSendMessage, className, hidePrologue, isProcessing, onSeachChange, onStop }: { user: UserState, className?: string, props?: RenderInputAreaProps | undefined, onSendMessage?: (message: string) => void, hidePrologue: boolean, isProcessing: boolean, onSeachChange?: (isSearch: boolean) => void, onStop?: () => void }) => {
    const prologueRef = useRef<HTMLDivElement>(null);
    const { i18n } = useLingui();
    const [messageContent, setMessageContent] = useState("");
    const [files] = useState<FileItem[]>([]);
    const greet = useMemo(
        () => Prologues[Math.floor(Math.random() * Prologues.length)],
        []
    )
    const handleSendMessage = (content: string) => {
        if (!content || content.trim() === "") {
            toast.error(i18n._(`Please enter a message before sending.`));
            return;
        }

        if (onSendMessage) {
            onSendMessage(content);
        }

        if (props && props.onSend) {
            props?.onSend(content, files);
        }

        setMessageContent("");
    }

    const handleKeyUp = (e: React.KeyboardEvent<any>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            handleSendMessage(messageContent);
        }
    }

    const handleSearchInternet = (isSelected: boolean) => {
        if (!onSeachChange) return
        onSeachChange(isSelected);
    }

    useEffect(() => {
        if (prologueRef.current) {
            prologueRef.current.style.setProperty("--characters", greet.length.toString());
        }
    }, [greet]);

    return (
        <>
            <div className={`flex-col flex-1 transition-all ease-in-out flex items-center justify-center ${className || ""}`}>
                {hidePrologue && (
                    <>
                        <div className='text-xl text-center'>
                            <TypeAnimation
                                className={`font-semibold mb-6 mx-auto`}
                                sequence={[
                                    greet(user.nickname || user.email),
                                    (el) => el?.classList.add(CURSOR_CLASS_NAME),
                                ]}
                            />
                        </div>
                    </>
                )}
                <div className={`${hidePrologue ? "w-11/12 md:w-10/12 lg:w-[36rem]" : "w-10/12"} transition-all ease-in-out duration-200  bg-gray-100 m-2 p-2 mx-4 rounded-3xl`}>
                    <Textarea minRows={3} maxRows={3} onKeyUp={handleKeyUp} value={messageContent} classNames={{ inputWrapper: "shadow-none" }} onValueChange={setMessageContent} />
                    <div className='flex items-center justify-between mt-2'>
                        <div>
                            <Button size='sm' isIconOnly variant="light" className='!rounded-full !p-2 hover:!bg-gray-200'>
                                <LinkSlashIcon className='w-4' />
                            </Button>
                            {
                                AIConfig.supportAISearch && (
                                    <SearchInternetButton onSelelctChange={handleSearchInternet}></SearchInternetButton>
                                )
                            }
                        </div>
                        <div>
                            {isProcessing ? (
                                <Button onKeyUp={handleKeyUp} isDisabled={!isProcessing} size='sm' color='primary' isIconOnly className='!rounded-full !p-2 ' onPress={onStop}>
                                    <PauseIcon className='w-4' />
                                </Button>
                            ) :
                                (
                                    <Button onKeyUp={handleKeyUp} isDisabled={messageContent == ""} size='sm' color='primary' isIconOnly className='!rounded-full !p-2 ' onPress={() => handleSendMessage(messageContent)}>
                                        <PaperAirplaneIcon className='w-4' />
                                    </Button>
                                )}
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}

export default AIChatInput;