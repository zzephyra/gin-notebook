import { Comment, CommentAttachment, CommentProps, MentionPayload } from "./type";
import CommentInput from "../input";
import { Button, ButtonGroup, Card, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Tooltip } from "@heroui/react";
import CommentBox from "../box";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useLingui } from "@lingui/react/macro";
import { ArrowsUpDownIcon, AtSymbolIcon, BarsArrowDownIcon, DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { TaskCommentFilter } from "@/features/api/type";
import { AnimatePresence, motion } from "framer-motion";
import { useCommentActions } from "@/contexts/CommentContext";
import { responseCode } from "@/features/constant/response";
import { useEffect, useRef } from "react";
import ChaseLoading from "@/components/loading/Chase/loading";
const FilterMapping: Record<string, string> = {
    create: "Created Time",
    update: "Updated Time",
}

function DefaultEmptyComment() {
    const { t } = useLingui();
    return (
        <>
            <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </div>
                <p className="text-sm text-gray-500 mb-1">{t`No comments yet`}</p>
                <p className="text-xs text-gray-400">{t`Start a conversation below`}</p>
            </div>
        </>
    )
}

function Comments(props: CommentProps) {
    const { t } = useLingui();
    const params = useParams();
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const workspaceId = params.id || "";
    const { comments, createComment, deleteComment, isFetchingNextPage, fetchNextPage, updateComment, createCommentAttachment, hasNextPage } = useCommentActions();
    const handleSubmit = async (text: string, mentions: MentionPayload[], attachments: CommentAttachment[]) => {
        const temp_id = crypto.randomUUID();
        var data = {
            id: temp_id,
            content: text,
            mentions: mentions.map((mention) => ({
                ...mention,
                action: mention.action || "create", // 默认创建
            })),
            attachments: attachments.map((attachment) => ({
                url: attachment.url,
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                sha256_hash: attachment.sha256_hash,
            })),
            status: "",
            author: props.currentUser,
            member_id: props.currentUser.id,
            workspace_id: workspaceId,
            task_id: props.taskId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        if (props.onCommentSubmit) {
            props.onCommentSubmit(
                data as Comment
            )
        }
        createComment.mutate(data, {
            onSuccess: (res) => {
                if (res.code === responseCode.SUCCESS) {
                    toast.success(t`Comment submitted successfully`);
                } else {
                    toast.error(t`Failed to submit comment: ${res.message}`);
                }
            },
            onError: (error) => {
                console.error("Error submitting comment:", error);
            },
        })
        // createTaskCommentRequest(data).then((res) => {
        //     if (res.data) {
        //         if (props.onCommentUpdate) {
        //             props.onCommentUpdate(
        //                 temp_id,
        //                 res.data
        //             )
        //         } else {
        //             toast.success(t`Comment submitted successfully`);
        //         }
        //     }
        // })
    }

    const handleUpdateComment = (commentID: string, content: string, mentions: MentionPayload[]) => {
        updateComment.mutate({ commentID, patch: { content, mentions } }, {
            onSuccess: (res) => {
                if (res.code === responseCode.SUCCESS) {
                    toast.success(t`Comment updated successfully`);
                } else {
                    toast.error(t`Failed to update comment: ${res.message}`);
                }
            },
            onError: (error) => {
                console.error("Error updating comment:", error);
            },
        });
    }

    const updateFilter = (filter: Partial<TaskCommentFilter>) => {
        if (props.onFilterChange) {
            props.onFilterChange(filter);
        }
    }


    const handleUpload = async (files: File[], commentID: string) => {
        await Promise.all(
            files.map((f) => createCommentAttachment.mutateAsync({ file: f, commentID }))
        );
    };

    const handleDeleteComment = (commentID: string) => {
        deleteComment.mutate(commentID, {})
    }

    useEffect(() => {
        if (!hasNextPage) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );
        const node = loadMoreRef.current;
        if (node) observer.observe(node);

        return () => {
            if (node) observer.unobserve(node);
        };
    }, [hasNextPage, fetchNextPage]);

    return (
        <>
            <div className="flex gap-2">
                {/* <Avatar src={props.currentUser.avatar} className="w-8 h-8"></Avatar> */}
                <CommentInput onSubmit={handleSubmit}>
                </CommentInput>
            </div>
            <div className="flex flex-col gap-2" >

                {
                    comments.length === 0 ? (
                        <>
                            {
                                props.emptyRender ? props.emptyRender : <DefaultEmptyComment />
                            }
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between">
                                <Card className="rounded-lg">
                                    <ButtonGroup size="sm" variant="light" >
                                        <Dropdown classNames={{ content: "!min-w-[0px]" }}>
                                            <DropdownTrigger>
                                                <Button>
                                                    <BarsArrowDownIcon className="w-4 h-4" />
                                                    {t`${FilterMapping[props.filter?.order_by || "create"]}`}
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu>
                                                <DropdownItem key="created_at" onClick={() => updateFilter({ order_by: "create" })}>
                                                    {t`Created Time`}
                                                </DropdownItem>
                                                <DropdownItem key="updated_at" onClick={() => updateFilter({ order_by: "update" })}>
                                                    {t`Updated Time`}
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                        <Button isIconOnly >
                                            <ArrowsUpDownIcon className="w-4 h-4" />
                                        </Button>
                                    </ButtonGroup>
                                </Card>
                                <div className="flex gap-2">
                                    <Card>
                                        <Tooltip content={t`Mention me`} showArrow={true} delay={1000}>
                                            <Button color={!props.filter?.mention_me ? undefined : "primary"} variant={!props.filter?.mention_me ? "light" : undefined} size="sm" isIconOnly onPress={() => updateFilter({ mention_me: !props.filter?.mention_me })} >
                                                <AtSymbolIcon className="w-4 h-4" />
                                            </Button>
                                        </Tooltip>
                                    </Card>
                                    <Card>
                                        <Tooltip content={t`Has attachments`} showArrow={true} delay={1000} placement="top-end">
                                            <Button size="sm" color={props.filter?.has_attachment ? "primary" : undefined} variant={!props.filter?.has_attachment ? "light" : undefined} isIconOnly onPress={() => updateFilter({ has_attachment: !props.filter?.has_attachment })} >
                                                <DocumentMagnifyingGlassIcon className="w-4 h-4" />
                                            </Button>
                                        </Tooltip>
                                    </Card>
                                </div>
                            </div>
                            <AnimatePresence initial={false} mode="popLayout"> {/* 新增 mode */}
                                {comments.map((c) => (
                                    <motion.div
                                        key={c.id}
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{
                                            height: 0,
                                            opacity: 0,
                                            marginTop: 0,
                                            marginBottom: 0,
                                            paddingTop: 0,
                                            paddingBottom: 0,
                                        }}
                                        transition={{
                                            height: { duration: 0.22 },
                                            opacity: { duration: 0.16 },
                                        }}
                                        layout="position"
                                    >
                                        <motion.div
                                            style={{ transformOrigin: "top" }}
                                            initial={{ opacity: 0, y: -12, scale: 0.98 }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                                transition: {
                                                    y: { type: "spring", stiffness: 420, damping: 28, mass: 0.2 },
                                                    opacity: { duration: 0.18 },
                                                },
                                            }}
                                            exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.18 } }}
                                        >
                                            <CommentBox onUpload={handleUpload} onUpdate={handleUpdateComment} comment={c} onDelete={handleDeleteComment} />
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                        </>
                    )
                }

            </div >
            {/* 加载更多占位符 */}
            {comments.length > 0 && (
                <div ref={loadMoreRef} className="py-4 text-center text-gray-500 text-xs">
                    {isFetchingNextPage
                        ? <ChaseLoading text={t`Loading more comments...`}></ChaseLoading>
                        : hasNextPage
                            ? t`Load more on scroll`
                            : <span>{t`No more comments`}</span>}
                </div>
            )}
        </>
    );
}

export default Comments;