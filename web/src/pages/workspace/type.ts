import { Block } from "@blocknote/core"

export interface Note {
    id: string
    title: string
    category_id: string | null
    workspace_id: string
    content: Block[]
    share: boolean
    allow_edit: boolean
    allow_comment: boolean
    allow_share: boolean
    allow_invite: boolean
    allow_join: boolean
    status: string
    owner_id: string
    owner_name: string
    owner_avatar: string
    owner_email: string
    is_favorite: boolean
    updated_at: string
    [key: string]: any
}

export interface NoteCategory {
    id: string
    category_name: string
    total: number
}