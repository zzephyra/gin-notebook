import { useLingui } from "@lingui/react/macro";
import { IconPaperclip, IconAt, IconSend } from "@douyinfe/semi-icons";
import { Button } from "@heroui/button";
import { CommentInputProps } from "./type";
import { useRef, useState, useEffect } from "react";
import { useTodo } from "@/contexts/TodoContext";
import { CommentAttachment } from "../main/type";
import { UploadFile } from "@/lib/upload";
import { UploadController } from "@/lib/upload/type";
import { getPercent } from "./script";
import CommentAttachmentFile from "@/components/comment/attachment/index";
import { PhotoProvider } from "react-photo-view";
import toast from "react-hot-toast";
import { hashFilesSHA256 } from "@/utils/hashFiles";
import CommentContent from "../content";
import { CommentContentHandle } from "../content/types";

const CommentInput = (props: CommentInputProps) => {
    const { t } = useLingui();
    const { setActiveOverlay } = useTodo();

    const containerRef = useRef<HTMLDivElement>(null); // 整个输入组件容器
    const uploadRef = useRef<HTMLInputElement>(null); // 上传文件 input
    const contextRef = useRef<CommentContentHandle>(null);

    const [attachmentFiles, setAttachmentFiles] = useState<CommentAttachment[]>([]); // 附件列表
    const controllersRef = useRef<Map<string, UploadController>>(new Map());

    // ✅ 只在挂载时自动聚焦一次（光标移到末尾）
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            contextRef.current?.focus?.(true);
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    const handleSubmit = async () => {
        if (!contextRef.current) return;
        const { content, mentions } = contextRef.current.getContent();
        if (content.trim() === "") {
            toast.error(t`Comment cannot be empty`);
            return;
        }
        if (attachmentFiles.filter((f) => f.status === "uploading").length > 0) {
            toast.error(t`Please wait for attachments to finish uploading.`);
            return;
        }
        await props.onSubmit?.(content, mentions, attachmentFiles);
    };

    const startOneUpload = async (file: File) => {
        const tmpId = globalThis.crypto?.randomUUID?.() ?? `tmp_${Date.now()}_${Math.random()}`;
        const fileHash = await hashFilesSHA256([file]);

        setAttachmentFiles((prev) => [
            ...prev,
            {
                id: tmpId,
                url: "",
                name: file.name,
                size: file.size,
                type: file.type,
                status: "uploading",
                progress: 0,
                from: "input",
                sha256_hash: fileHash[0].sha256,
                originalFile: file,
            },
        ]);

        const controller = UploadFile({ file });
        controllersRef.current.set(tmpId, controller);

        const off = controller.on((e) => {
            if (e.type === "progress") {
                const p = getPercent(e.progress);
                setAttachmentFiles((prev) => prev.map((a) => (a.id === tmpId ? { ...a, progress: p } : a)));
            } else if (e.type === "error") {
                setAttachmentFiles((prev) =>
                    prev.map((a) =>
                        a.id === tmpId
                            ? {
                                ...a,
                                status: "error",
                                error: String(e.error?.message ?? e.error),
                                progress: a.progress ?? 0,
                            }
                            : a
                    )
                );
                controllersRef.current.delete(tmpId);
                off();
            } else if (e.type === "complete") {
                setAttachmentFiles((prev) =>
                    prev.map((a) =>
                        a.id === tmpId
                            ? {
                                ...a,
                                status: "uploaded",
                                url: e.result.url,
                                key: e.result.key,
                                progress: 100,
                            }
                            : a
                    )
                );
                controllersRef.current.delete(tmpId);
                off();
            }
        });

        controller.promise.catch(() => {
            /* 已在 on('error') 里处理 */
        });
    };

    const uploadAttachment = async (e: any) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        files.forEach((file) => startOneUpload(file as File));
        e.target.value = "";
    };

    const handleDeleteAttachment = (attachment_id: number | string) => {
        setAttachmentFiles((prev) => prev.filter((a) => a.id !== attachment_id));
        controllersRef.current.delete(String(attachment_id));
    };

    return (
        <div ref={containerRef} className={`flex-1 ${props.className || ""}`}>
            <CommentContent
                ref={contextRef}
                container={containerRef}
                inputStyle={{
                    minHeight: 80,
                    width: 400,
                    padding: 8,
                    border: "1px solid #ddd",
                    borderRadius: 4,
                }}
                editable
            />

            <div className="flex items-center justify-between">
                <div>
                    <Button size="sm" variant="light" isIconOnly onPress={() => uploadRef.current?.click()}>
                        <IconPaperclip />
                    </Button>
                    <input type="file" className="hidden" ref={uploadRef} multiple onChange={uploadAttachment} />
                    <Button size="sm" variant="light" isIconOnly>
                        <IconAt />
                    </Button>
                </div>
                <div>
                    <Button size="sm" variant="light" isIconOnly onPress={handleSubmit}>
                        <IconSend />
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-2 my-2">
                <PhotoProvider
                    onVisibleChange={(open) => {
                        setActiveOverlay && setActiveOverlay(open);
                    }}
                >
                    {attachmentFiles.map((file) => (
                        <CommentAttachmentFile key={file.id} attachment={file} onDelete={handleDeleteAttachment} />
                    ))}
                </PhotoProvider>
            </div>
        </div>
    );
};

export default CommentInput;
