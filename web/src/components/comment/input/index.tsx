import { useLingui } from "@lingui/react/macro";
import { IconPaperclip, IconAt, IconSend } from "@douyinfe/semi-icons";
import { Button } from "@heroui/button";
import { CommentInputProps } from "./type";
import { useRef, useState } from 'react';
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


    const handleSubmit = async () => {
        if (!contextRef.current) return;
        const { content, mentions } = contextRef.current.getContent();
        if (content.trim() === '') {
            toast.error(t`Comment cannot be empty`);
            return;
        }
        if (attachmentFiles.filter(f => f.status === 'uploading').length > 0) {
            toast.error(t`Please wait for attachments to finish uploading.`);
            return;
        }
        await props.onSubmit?.(content, mentions, attachmentFiles);
    }

    // 


    // const cancelUpload = (id: string) => {
    //     const ctrl = controllersRef.current.get(id);
    //     if (ctrl) {
    //         ctrl.cancel();
    //         controllersRef.current.delete(id);
    //         setAttachmentFiles(prev =>
    //             prev.map(a =>
    //                 a.id === id ? { ...a, status: 'error', error: 'Canceled by user' } : a
    //             )
    //         );
    //     }
    // };

    const startOneUpload = async (file: File) => {
        const tmpId =
            globalThis.crypto?.randomUUID?.() ?? `tmp_${Date.now()}_${Math.random()}`;
        var fileHash = await hashFilesSHA256([file])
        // 先把占位项插入列表
        setAttachmentFiles(prev => [
            ...prev,
            {
                id: tmpId,
                url: '',
                name: file.name,
                size: file.size,
                type: file.type,
                status: 'uploading',
                progress: 0,
                sha256_hash: fileHash[0].sha256,
                originalFile: file, // 可选：后续做“重试”会有用
            },
        ]);

        // 创建上传任务
        const controller = UploadFile({
            file,
        });

        controllersRef.current.set(tmpId, controller);

        // 订阅事件
        const off = controller.on(e => {
            if (e.type === 'progress') {
                const p = getPercent(e.progress);
                setAttachmentFiles(prev =>
                    prev.map(a =>
                        a.id === tmpId ? { ...a, progress: p } : a
                    )
                );
            } else if (e.type === 'error') {
                setAttachmentFiles(prev =>
                    prev.map(a =>
                        a.id === tmpId
                            ? {
                                ...a,
                                status: 'error',
                                error: String(e.error?.message ?? e.error),
                                progress: a.progress ?? 0,
                            }
                            : a
                    )
                );
                controllersRef.current.delete(tmpId);
                off();
            } else if (e.type === 'complete') {
                setAttachmentFiles(prev =>
                    prev.map(a =>
                        a.id === tmpId
                            ? {
                                ...a,
                                status: 'uploaded',
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

        // 如果你确实想拿到 promise 结果（例如统计全部完成）
        // 也可以在这里附加处理，但不要阻塞 UI 更新：
        controller.promise.catch(() => {
            /* 已在 on('error') 里处理 UI，这里无需额外处理 */
        });
    };

    const uploadAttachment = async (e: any) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        // 并发启动
        files.forEach((file) => startOneUpload(file as File));

        // 允许再次选择同名文件
        e.target.value = '';
    }


    // 点击 mention → Popover



    const handleDeleteAttachment = (attachment_id: number | string) => {
        setAttachmentFiles(prev => prev.filter(a => a.id !== attachment_id));
        controllersRef.current.delete(String(attachment_id));
    }

    return (
        <div ref={containerRef} className={`flex-1 ${props.className || ''}`}>
            <CommentContent ref={contextRef} container={containerRef} inputStyle={{
                minHeight: 80, width: 400, padding: 8,
                border: '1px solid #ddd', borderRadius: 4,
            }} />
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
                {/* 附件列表 */}
                <PhotoProvider onVisibleChange={(open) => {
                    setActiveOverlay && setActiveOverlay(open);
                }}>
                    {attachmentFiles.map((file) => (<>
                        <CommentAttachmentFile attachment={file} onDelete={handleDeleteAttachment}></CommentAttachmentFile>
                    </>))}
                </PhotoProvider>
            </div>
        </div>
    )
}

export default CommentInput;