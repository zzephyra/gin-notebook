import { Comment, MentionPayload } from "../main/type"

export type CommentBoxProps = {
    comment: Comment
    onDelete?: (commentID: string) => void
    onUpdate?: (commentID: string, content: string, mentions: MentionPayload[]) => void
    onUpload?: (files: File[], commentID: string) => void
    onLikeComment?: (commentID: string, like?: boolean) => void
}