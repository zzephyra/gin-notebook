import { Comment } from "../main/type"

export type CommentBoxProps = {
    comment: Comment
    onDelete?: (commentID: string) => void
}