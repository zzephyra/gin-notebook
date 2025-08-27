import { Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { CommentBoxProps } from "./type";
import { PhotoProvider } from "react-photo-view";
import { CloudArrowUpIcon, EllipsisHorizontalIcon, HandThumbDownIcon, HandThumbUpIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useLingui } from "@lingui/react/macro";
import CommentAttachment from "../attachment";
import { useTodo } from "@/contexts/TodoContext";

import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";
import CommentContent from "../content";
import type { CommentContentHandle } from "../content/types";

function CommentBox(props: CommentBoxProps) {
    const { t } = useLingui();

    // 根容器（卡片）
    const rootRef = useRef<HTMLDivElement>(null);
    const uploadRef = useRef<HTMLInputElement>(null);
    // ✅ 专用 overlay 容器（relative + 高 z-index），用于承载浮层
    const overlayRef = useRef<HTMLDivElement>(null);
    const [overlayEl, setOverlayEl] = useState<HTMLElement | null>(null);
    useLayoutEffect(() => {
        setOverlayEl(overlayRef.current);
    }, []);

    const [visible, setVisible] = useState(false);
    const { setActiveOverlay } = useTodo();

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<CommentContentHandle>(null);

    const [contentEditable, setContentEditable] = useState(false);

    // 忽略进入编辑后的“下一次 pointerdown”
    const ignoreNextPointerRef = useRef(false);

    // 提交（父层统一收口）
    const doSubmit = useCallback(() => {
        if (!contentEditable) return;
        const payload = contentRef.current?.getContent();
        setContentEditable(false);
        if (payload && props.onUpdate) {
            const { content, mentions } = payload;
            props.onUpdate(props.comment.id, content, mentions);
        }
    }, [contentEditable]);

    const handleEditContent = () => {
        if (!contentEditable) {
            ignoreNextPointerRef.current = true;
        }; // 已经在编辑状态了
        // 进入编辑的这次点击忽略
        setContentEditable(true);            // 子组件会自动 focus 到末尾
    };

    const handleDeleteComment = () => {
        props.onDelete?.(props.comment.id);
    };

    const handleUpdate = (e: any) => {
        const files: File[] = Array.from(e.target.files ?? []);
        if (!files.length) return;
        if (props.onUpload) {
            props.onUpload(files, props.comment.id);
        }
    }


    // 入场动效（只在初次出现时做一次）
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { root: null, threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={rootRef}
            className="comment-box group gap-2 my-2"
            style={{
                // ⚠️ 可见后一定用 `transform: none`，避免生成不必要的 stacking context
                transform: visible ? "none" : "translateY(20px)",
                opacity: visible ? 1 : 0,
                transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
                position: "relative",
            }}
        >
            <div>
                <div className="flex items-center justify-between text-gray-500 text-xs">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8" src={props.comment.author.avatar} />
                        <div>
                            <span className="font-semibold text-xs">
                                {props.comment.author.workspace_nickname || props.comment.author.user_nickname || props.comment.author.email}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">{new Date(props.comment.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button onPress={handleEditContent} isIconOnly variant="light" size="sm" className="p-1">
                            <PencilSquareIcon className="w-4 h-4 text-gray-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-colors" />
                        </Button>
                        <Dropdown className="!min-w-[140px]">
                            <DropdownTrigger>
                                <Button isIconOnly variant="light" size="sm" className="p-1">
                                    <EllipsisHorizontalIcon className="w-4 h-4 text-gray-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-colors" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem key="upload" onPress={() => uploadRef.current?.click()} startContent={<CloudArrowUpIcon className="w-4 h-4" />}>
                                    {t`Upload File`}
                                </DropdownItem>
                                <DropdownItem key="delete" color="danger" onPress={handleDeleteComment} startContent={<TrashIcon className="w-4 h-4" />}>
                                    {t`Delete`}
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                        <input ref={uploadRef} multiple type="file" onChange={handleUpdate} className="hidden" />
                    </div>
                </div>

                <div className="py-4 flex flex-col gap-1 text-sm text-gray-700 dark:text-white break-all px-2">
                    <div ref={containerRef} className="py-4 flex flex-col gap-1 text-sm text-gray-700 dark:text-white relative">
                        <CommentContent
                            container={containerRef}
                            // ✅ 这里传“稳定的” overlay DOM 节点，避免 ref.current 初次为 null
                            portalContainer={overlayEl}
                            ref={contentRef}
                            onBlur={doSubmit}
                            defaultValue={{ content: props.comment.content, mentions: props.comment.mentions || [] }}
                            editable={contentEditable}
                        />

                        <PhotoProvider onVisibleChange={(open) => setActiveOverlay?.(open)}>
                            {(props.comment.attachments || [])?.map((attachment) => (
                                <CommentAttachment key={attachment.id} attachment={attachment} />
                            ))}
                        </PhotoProvider>

                        <style>{`.mention:focus { outline: none; }`}</style>
                    </div>
                </div>

                {/* ✅ 专用浮层容器：relative + 高 z-index。放在卡片末尾，绘制顺序在最上 */}
                <div
                    ref={overlayRef}
                    style={{ position: "relative", zIndex: 200 }}
                    className="pointer-events-none"
                />

                <div className="flex items-center gap-3 text-gray-500 mt-2">
                    <HandThumbUpIcon className="w-3 h-3" />
                    <HandThumbDownIcon className="w-3 h-3" />
                </div>
            </div>
        </div>
    );
}

export default CommentBox;
