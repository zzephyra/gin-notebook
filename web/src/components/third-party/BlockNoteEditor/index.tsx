import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import { Block, BlockNoteSchema, defaultInlineContentSpecs, filterSuggestionItems } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import { BlockNoteOptions } from "./type";
import {
    AIMenuController,
    AIToolbarButton,
    createAIExtension,
    getAIExtension,
    getAISlashMenuItems,
} from "@blocknote/xl-ai"
import { DefaultChatTransport } from "ai";
// import { streamText, UIMessage, convertToModelMessages } from 'ai';

// import { ComponentProps, useComponentsContext } from "@blocknote/react";
import "@blocknote/xl-ai/style.css";
// import {
//     DefaultThreadStoreAuth,
//     // YjsThreadStore,
//     RESTYjsThreadStore
// } from "@blocknote/core/comments";
// import { createDeepSeek } from "@ai-sdk/deepseek";
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
// import { YDocProvider } from "@y-sweet/react";
import type { User } from "@blocknote/core/comments";
import { getUserInfoByIDRequest } from "@/features/api/user";
import { diffSnapshots, flattenDocument } from "@/utils/blocksSnapshot";
import { PatchOp } from "@/types/note";
import "./style.css"
import { useSelector } from "react-redux";
import { RootState } from "@/store";
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

const BlockNoteEditor = ({ noteID, content, onChange, options, className }: { noteID: string, content?: Block[], className?: string, onChange?: (value: PatchOp[]) => void, options?: BlockNoteOptions }) => {
    return (
        // <YDocProvider
        //     docId={noteID}
        //     authEndpoint="https://demos.y-sweet.dev/api/auth"
        // >
        <BlockNoteEditorInner options={options} noteID={noteID} content={content} onChange={onChange} className={className} />
        // </YDocProvider>

    )
}

function createMameosAIExtension(workspaceId?: string) {
    const wsRef = useRef<string | undefined>(workspaceId);
    useEffect(() => { wsRef.current = workspaceId; }, [workspaceId]);
    var plugin = createAIExtension({
        transport: new DefaultChatTransport({
            // URL to your backend API, see example source in `packages/xl-ai-server/src/routes/regular.ts`
            api: BASE_URL + aiChatApi,
            fetch: async (_: RequestInfo | URL, init?: RequestInit) => {

                const baseBody = await (async () => {
                    const b = init?.body;
                    if (!b) return {};
                    if (typeof b === "string") {
                        try { return JSON.parse(b); } catch { return {}; }
                    }
                    // 其余 BodyInit（ReadableStream、Blob、FormData、URLSearchParams…）
                    try {
                        // 如果不是 JSON 格式，这里会抛错，直接落回 {}
                        return await new Response(b as BodyInit).json();
                    } catch {
                        return {};
                    }
                })();

                // 2) 合并你自定义的字段
                const merged = {
                    ...baseBody,
                    workspace_id: String(wsRef.current ?? ""),
                };
                return fetch(`${BASE_URL}${aiChatApi}`, {

                    method: "POST",
                    credentials: "include",   // 关键！带上 Cookie
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "text/event-stream",
                    },
                    body: JSON.stringify(merged),
                    signal: init?.signal,
                });
            }
        }),
        // stream: true
    })
    return plugin;
}


const BlockNoteEditorInner = ({ noteID, content, onChange, options, className }: { noteID: string, content?: Block[], onChange?: (value: PatchOp[]) => void, options?: BlockNoteOptions, className?: string }) => {
    // const client = createBlockNoteAIClient({
    //     apiKey: "PLACEHOLDER",
    //     baseURL: BASE_URL + aiChatApi,
    // });
    var workspace = useSelector((state: RootState) => state.workspace.currentWorkspace);

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
    const prevContent = useRef<Block[]>();
    const editor = useCreateBlockNote(
        {
            dictionary: {
                ...localeMapping[i18n.locale as keyof typeof localeMapping] || localeMapping.en,
                placeholders: {
                    // ...localeMapping[i18n.locale as keyof typeof localeMapping].placeholders,
                    // We override the empty document placeholder
                    emptyDocument: "Start typing..",
                    // We override the default placeholder
                    // default: "Custom default placeholder",
                    // We override the heading placeholder
                    // heading: "Custom heading placeholder",
                },
            },
            schema,
            extensions: [
                createMameosAIExtension(workspace?.id),
            ],
            resolveUsers,
            initialContent: content?.length == 0 ? [{ "id": "1", "type": "paragraph" }] : content,
        }, [noteID]);

    const handleOnChange = async () => {
        const markdownContent = editor.document;
        const flattened = flattenDocument(markdownContent);
        const diff = diffSnapshots(flattenDocument(prevContent.current || []), flattened);
        if (onChange) {
            onChange(diff);
        }
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
            prevNoteId.current = noteID;
            prevContent.current = content || [];
        }
    }, [content]);


    return (
        <>
            <BlockNoteView editor={editor}
                className={`h-full w-full ${className || ""}`}
                onChange={handleOnChange}
                formattingToolbar={false}
                editable={options?.editable !== false}
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
            </BlockNoteView >
        </>
    )
}

export default BlockNoteEditor;