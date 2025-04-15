import { NoteProps } from "./script";
import { useLingui } from "@lingui/react/macro";
import Tiptap from "@/components/third-party/tiptap";
import { useState } from "react";
import { debounce } from "lodash";
import { AutoUpdateContent } from "@/features/api/workspace";
import { useParams } from "react-router-dom";
import { responseCode } from "@/features/constant/response";

export default function NotePage(props: NoteProps) {
    const { t } = useLingui();
    const [content, setContent] = useState<string>(props.note.content);
    const params = useParams();
    const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const handleChangeContent = debounce((newContent: string) => {
        console.log(newContent, content)
        setSaving(true);
        setContent(newContent);
        AutoUpdateContent({
            content: newContent,
            workspace_id: Number(params.id),
        }).then((res) => {
            if (res.code == responseCode.SUCCESS) {
                setLastSaveTime(new Date().toLocaleTimeString());
                setSaving(false);
            } else {
                setSaving(false);
                setError(res.error);
            }
        })
    }, 300)
    return (
        <>
            <div className="flex flex-col h-screen">
                <div className="h-11 flex items-center justify-between px-4">
                    <div>

                    </div>
                    <div>
                        {props.note.title}
                    </div>
                    <div>

                    </div>
                </div>
                <div>
                    <div>

                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <Tiptap content={content} onChangeContent={handleChangeContent}></Tiptap>
                </div>
            </div>
        </>
    )
}

