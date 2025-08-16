import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { CommentBoxProps } from "./type";
import { PhotoProvider } from 'react-photo-view';
import { EllipsisHorizontalIcon, HandThumbDownIcon, HandThumbUpIcon } from "@heroicons/react/24/outline";
import { useLingui } from "@lingui/react/macro";
import CommentAttachment from "../attachment";
import { useTodo } from "@/contexts/TodoContext";

import { useRef, useState, useEffect } from 'react';
import { handleKeyDown } from "../script";
import CommentContent from "../content";
import { CommentContentHandle } from "../content/types";
import { MentionPayload } from "../main/type";
// …其余 import 保持你的原样



export function CommentBody({ comment }: {
    comment: {
        content: string;
        attachments?: any[];
        mentions?: MentionPayload[];
    };
}) {
    const { setActiveOverlay } = useTodo();
    const containerRef = useRef<HTMLDivElement>(null);
    const popRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<CommentContentHandle>(null);

    const [popover, setPopover] = useState<{
        visible: boolean;
        left: number;
        top: number;
        member?: any;
    }>({ visible: false, left: 0, top: 0 });

    // 关闭 popover：点击外部
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!popover.visible) return;
            if (!containerRef.current) return;
            if (popRef.current?.contains(e.target as Node)) return;
            // 若点到 mention 也会重新打开，这里先关
            setPopover(p => ({ ...p, visible: false }));
            setActiveOverlay?.(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [popover.visible, setActiveOverlay]);

    return (
        <div ref={containerRef} className="py-4 flex flex-col gap-1 text-sm text-gray-700 dark:text-white relative">
            {/* 文本 + mention */}
            <div contentEditable onKeyDown={handleKeyDown} className="whitespace-pre-wrap break-words">

                <CommentContent container={containerRef} ref={contentRef} defaultValue={{ content: comment.content, mentions: comment.mentions || [] }} />
            </div>

            {/* Popover：显示 member 信息 */}
            {popover.visible && popover.member && (
                <div
                    ref={popRef}
                    style={{ position: 'absolute', left: popover.left, top: popover.top, zIndex: 30 }}
                    className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg p-3 min-w-[220px]"
                >
                    <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8" src={popover.member.avatar} />
                        <div>
                            <div className="font-semibold">
                                {popover.member.workspace_nickname ||
                                    popover.member.user_nickname ||
                                    popover.member.email}
                            </div>
                            <div className="text-xs text-gray-500">{popover.member.email}</div>
                        </div>
                    </div>
                    {!!popover.member.role?.length && (
                        <div className="mt-2 text-xs text-gray-400">
                            角色：{Array.isArray(popover.member.role) ? popover.member.role.join(', ') : String(popover.member.role)}
                        </div>
                    )}
                </div>
            )}

            {/* 附件列表（保持你原来的逻辑） */}
            <PhotoProvider onVisibleChange={(open) => setActiveOverlay?.(open)}>
                {(comment.attachments || [])?.map((attachment) => (
                    <CommentAttachment key={attachment.id} attachment={attachment} />
                ))}
            </PhotoProvider>

            {/* mention 的基础样式（如需） */}
            <style>{`
        .mention:focus { outline: none; }
      `}</style>
        </div>
    );
}


function CommentBox(props: CommentBoxProps) {
    const { t } = useLingui();
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    const handleDeleteComment = () => {
        if (props.onDelete) {
            props.onDelete(props.comment.id);
        }
    }

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        observer.unobserve(entry.target); // 只触发一次
                    }
                });
            },
            {
                root: null, // 默认是 viewport
                threshold: 0.1, // 显示 10% 就触发
            }
        );

        observer.observe(el);
        return () => {
            observer.disconnect();
        };
    }, []);
    return (
        <div ref={ref} className="comment-box group flex gap-2 my-2"
            style={{
                transform: visible ? "translateY(0)" : "translateY(20px)",
                opacity: visible ? 1 : 0,
                transition: "all 0.5s ease-out",
            }}>
            <Avatar className="h-8 w-8" src={props.comment.author.avatar}></Avatar>
            <div className="flex-1">
                <div className="flex items-center justify-between text-gray-500 text-xs">
                    <div>
                        <span className="font-semibold text-xs">{props.comment.author.workspace_nickname || props.comment.author.user_nickname || props.comment.author.email}</span>
                        <span className="text-xs text-gray-500 ml-2">
                            {new Date(props.comment.created_at).toLocaleString()}
                        </span>
                    </div>
                    <div>
                        <Dropdown>
                            <DropdownTrigger>
                                <EllipsisHorizontalIcon className="w-4 h-4 text-gray-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-colors" />
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem key="edit">
                                    {t`Edit`}
                                </DropdownItem>
                                <DropdownItem key="delete" onPress={handleDeleteComment}>
                                    {t`Delete`}
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
                <div className="py-4 flex flex-col gap-1 text-sm text-gray-700 dark:text-white break-all px-2">
                    <CommentBody comment={props.comment} />
                </div>

                <div className="flex items-center gap-3 text-gray-500">
                    <HandThumbUpIcon className="w-3 h-3" />
                    <HandThumbDownIcon className="w-3 h-3" />
                </div>
            </div>
        </div>
    );
}

export default CommentBox;