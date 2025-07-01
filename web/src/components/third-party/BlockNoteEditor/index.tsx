import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
// import { filterSuggestionItems } from "@blocknote/core";
import "@blocknote/mantine/style.css";
// import {
//     AIMenuController,
//     AIToolbarButton,
//     createAIExtension,
//     createBlockNoteAIClient,
//     getAISlashMenuItems,
// } from "@blocknote/xl-ai"
// import { ComponentProps, useComponentsContext } from "@blocknote/react";

import {
    DefaultThreadStoreAuth,
    // YjsThreadStore,
    RESTYjsThreadStore
} from "@blocknote/core/comments";
import {
    // FormattingToolbar,
    // FormattingToolbarController,
    // SuggestionMenuController,
    // getDefaultReactSlashMenuItems,
    // getFormattingToolbarItems,
    useCreateBlockNote,
} from "@blocknote/react";
import { useEffect, useRef } from "react";
// import { en } from "@blocknote/core/locales";
// import { en as aiEn } from "@blocknote/xl-ai/locales";
// import { createDeepSeek } from "@ai-sdk/deepseek";
import { BASE_URL } from "@/lib/api/client";
// import { aiChatApi } from "@/features/api/routes";
import { YDocProvider, useYDoc } from "@y-sweet/react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import type { User } from "@blocknote/core/comments";
// import { getUserInfoByIDRequest } from "@/features/api/user";

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

// async function resolveUsers(userIds: string[]) {
//     var res = await getUserInfoByIDRequest(userIds[0])
//     if (res) {
//         return [{
//             id: res.id,
//             username: res.nickname || res.email,
//             avatarUrl: res.avatar,
//         }]
//     } else {
//         return [{
//             id: "0",
//             username: "Unknown User",
//             avatarUrl: "https://placehold.co/100x100?text=Unknown",
//         }]
//     }
// }

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

const BlockNoteEditorInner = ({ noteID, content, onChange }: { noteID: string, content?: string, onChange?: (value: string) => void }) => {
    // const client = createBlockNoteAIClient({
    //     apiKey: "PLACEHOLDER",
    //     baseURL: BASE_URL + aiChatApi,
    // });
    const currentUser = useSelector((state: RootState) => {
        return {
            id: state.user.id,
            username: state.user.nickname || state.user.email,
            avatarUrl: state.user.avatar || "https://placehold.co/100x100?text=User",
            role: "editor" as const, // or "comment" based on your logic
        }
    });

    const prevNoteId = useRef("");
    const prevContent = useRef("");
    // const provider = useYjsProvider();
    const doc = useYDoc();
    const threadStore = new RESTYjsThreadStore(
        // currentUser.id,
        BASE_URL + "/note/comments",
        {},
        doc.getMap("comments"),
        new DefaultThreadStoreAuth(currentUser.id, "editor"),
    );
    threadStore.createThread = async (options) => {
        const thread = {
            threadId: crypto.randomUUID(),     // 唯一标识符
            comments: [
                {
                    commentId: crypto.randomUUID(),
                    body: options.initialComment.body,
                    author: currentUser.id,
                    createdAt: new Date().toISOString(),
                }
            ],
        };
        return thread;
    }
    // threadStore.addThreadToDocument = async (thread) => {
    //     console.log("addThreadToDocument", thread);
    //     return
    // }
    // const model = createDeepSeek({
    //     // call via our proxy client
    //     ...client.getProviderSettings("openai"),
    // })("deepseek-r1-distill-llama-70b");
    const editor = useCreateBlockNote(
        {
            // resolveUsers,
            // comments: {
            //     threadStore,
            // },
            // collaboration: {
            //     provider,
            //     fragment: doc.getXmlFragment("blocknote"),
            //     user: { color: getRandomColor(), name: currentUser.username },
            // },
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
        const noteIdChanged = prevNoteId.current !== noteID;
        const contentChanged = prevContent.current !== content;
        if (noteIdChanged || contentChanged) {
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
            >

                {/* <AIMenuController /> */}

                {/* We disabled the default formatting toolbar with `formattingToolbar=false` 
        and replace it for one with an "AI button" (defined below). 
        (See "Formatting Toolbar" in docs)
        */}
                {/* <FormattingToolbarController
                    formattingToolbar={() => (
                        <FormattingToolbar>
                            {...getFormattingToolbarItems()}
                            <AIToolbarButton />
                        </FormattingToolbar>
                    )}
                /> */}
                {/* We disabled the default SlashMenu with `slashMenu=false` 
        and replace it for one with an AI option (defined below). 
        (See "Suggestion Menus" in docs)
        */}
                {/* <SuggestionMenuController
                    triggerCharacter="/"
                    getItems={async (query) =>
                        filterSuggestionItems(
                            [
                                ...getDefaultReactSlashMenuItems(editor),
                                // add the default AI slash menu items, or define your own
                                ...getAISlashMenuItems(editor),
                            ],
                            query,
                        )
                    }
                /> */}
            </BlockNoteView>
        </>
    )
}

export default BlockNoteEditor;