import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteSchema, defaultInlineContentSpecs, filterSuggestionItems } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import {
    AIMenuController,
    AIToolbarButton,
    createAIExtension,
    createBlockNoteAIClient,
    getAIExtension,
    getAISlashMenuItems,
} from "@blocknote/xl-ai"
// import { ComponentProps, useComponentsContext } from "@blocknote/react";
import "@blocknote/xl-ai/style.css";
// import {
//     DefaultThreadStoreAuth,
//     // YjsThreadStore,
//     RESTYjsThreadStore
// } from "@blocknote/core/comments";
import { createDeepSeek } from "@ai-sdk/deepseek";
import {
    FormattingToolbar,
    FormattingToolbarController,
    SuggestionMenuController,
    getDefaultReactSlashMenuItems,
    getFormattingToolbarItems,
    useCreateBlockNote,
} from "@blocknote/react";
import { i18n } from '@lingui/core';
import { useEffect, useRef, useState } from "react";
import { en as aiEn, zh as aiZh } from "@blocknote/xl-ai/locales";
import { en, zh } from "@blocknote/core/locales";
import { BASE_URL } from "@/lib/api/client";
import { aiChatApi } from "@/features/api/routes";
import { YDocProvider } from "@y-sweet/react";
import type { User } from "@blocknote/core/comments";
import { getUserInfoByIDRequest } from "@/features/api/user";
export type MyUserType = User & {
    role: "editor" | "comment";
};
const colors = [
    "#958DF1",
    "#F98181",
    "#FBBC88",
    "#FAF594",
    "#70CFF8",
    "#94FADB",
    "#B9F18D",
];

const getRandomElement = (list: any[]) =>
    list[Math.floor(Math.random() * list.length)];
export const getRandomColor = () => getRandomElement(colors);

const schema = BlockNoteSchema.create({
    inlineContentSpecs: {
        // Adds all default inline content.
        ...defaultInlineContentSpecs,
        // Adds the mention tag.
        // comment: commentMark,
    },

});

const localeMapping = {
    zh_cn: {
        ...zh, ai: aiZh
    },
    en: {
        ...en, ai: aiEn
    }
}

async function resolveUsers(userIds: string[]) {
    var res = await getUserInfoByIDRequest(userIds[0])
    if (res) {
        return [{
            id: res.id,
            username: res.nickname || res.email,
            avatarUrl: res.avatar,
        }]
    } else {
        return [{
            id: "0",
            username: "Unknown User",
            avatarUrl: "https://placehold.co/100x100?text=Unknown",
        }]
    }
}

const BlockNoteEditor = ({ noteID, content, onChange }: { noteID: string, content?: string, onChange?: (value: string) => void }) => {
    return (
        <YDocProvider
            docId={noteID}
            authEndpoint="https://demos.y-sweet.dev/api/auth"
        >
            <BlockNoteEditorInner noteID={noteID} content={content} onChange={onChange} />
        </YDocProvider>
    )
}

function createMameosAIExtension() {
    const client = createBlockNoteAIClient({
        apiKey: "",
        baseURL: BASE_URL + aiChatApi,
    });

    const model = createDeepSeek({
        // call via our proxy client
        ...client.getProviderSettings("openai"),
        baseURL: BASE_URL + aiChatApi,
        fetch: async (_: RequestInfo | URL, init?: RequestInit) => {
            return fetch(`${BASE_URL}${aiChatApi}`, {
                method: "POST",
                credentials: "include",   // 关键！带上 Cookie
                headers: {
                    "Content-Type": "application/json",
                    Accept: "text/event-stream",
                },
                body: init?.body,
                signal: init?.signal,
            });
        }
    })("deepseek-r1-distill-llama-70b");
    var plugin = createAIExtension({
        model,
        stream: true
    })
    return plugin;
}

const BlockNoteEditorInner = ({ noteID, content, onChange }: { noteID: string, content?: string, onChange?: (value: string) => void }) => {
    // const client = createBlockNoteAIClient({
    //     apiKey: "PLACEHOLDER",
    //     baseURL: BASE_URL + aiChatApi,
    // });
    const [aiRecommand, setAiRecommand] = useState<any>(null);

    // const currentUser = useSelector((state: RootState) => {
    //     return {
    //         id: state.user.id,
    //         username: state.user.nickname || state.user.email,
    //         avatarUrl: state.user.avatar || "https://placehold.co/100x100?text=User",
    //         role: "editor" as const, // or "comment" based on your logic
    //     }
    // });

    const prevNoteId = useRef("");
    const prevContent = useRef("");
    const editor = useCreateBlockNote(
        {
            dictionary: {
                ...localeMapping[i18n.locale as keyof typeof localeMapping] || localeMapping.en
            },
            schema,
            extensions: [
                createMameosAIExtension(),
            ],
            resolveUsers,
        });

    const handleOnChange = async () => {
        const markdownContent = await editor.blocksToMarkdownLossy(editor.document);
        if (onChange) {
            onChange(markdownContent);
        }
    }

    async function loadInitialHTML() {
        const blocks = await editor.tryParseMarkdownToBlocks(content || "");
        editor.replaceBlocks(editor.document, blocks);
    }


    useEffect(() => {
        const unsubscribe = getAIExtension(editor).store.subscribe(() => {
            setAiRecommand((getAIExtension(editor).store.getState().aiMenuState as any).status);
        });
        return () => unsubscribe();
    }, [editor]);
    useEffect(() => {
        const noteIdChanged = prevNoteId.current !== noteID;
        const contentChanged = prevContent.current !== content;
        if ((noteIdChanged || contentChanged) && !aiRecommand) {
            loadInitialHTML();
            prevNoteId.current = noteID;
            prevContent.current = content || "";
        }
    }, [content]);


    return (
        <>
            <BlockNoteView editor={editor}
                className="h-full w-full"
                onChange={handleOnChange}
                formattingToolbar={false}
            >

                <AIMenuController />

                {/* We disabled the default formatting toolbar with `formattingToolbar=false` 
        and replace it for one with an "AI button" (defined below). 
        (See "Formatting Toolbar" in docs)
        */}
                <FormattingToolbarController
                    formattingToolbar={() => (
                        <FormattingToolbar>
                            {...getFormattingToolbarItems()}
                            <AIToolbarButton />
                            {/* <Popover placement="bottom" showArrow={true}>
                                <PopoverTrigger>
                                    <Button className="rounded min-h-0 min-w-0" size="sm" variant="light" radius="sm" isIconOnly>
                                        <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <CommentInput editor={editor as any} schema={schema} />
                                </PopoverContent>
                            </Popover> */}

                        </FormattingToolbar>
                    )}
                />
                <SuggestionMenuController
                    triggerCharacter="/"
                    getItems={async (query) =>
                        filterSuggestionItems(
                            [
                                ...getDefaultReactSlashMenuItems(editor),
                                ...getAISlashMenuItems(editor),
                            ],
                            query,
                        )
                    }
                />
            </BlockNoteView>
        </>
    )
}

export default BlockNoteEditor;