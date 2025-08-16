import { CommentAttachment } from "../main/type"

export type CommentAttachmentProps = {
    attachment: CommentAttachment
    onDelete?: (attachment_id: number | string) => void
}