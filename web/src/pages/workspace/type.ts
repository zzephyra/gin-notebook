export interface Note {
    id: number
    title: string
    category_id: number | null
    workspace_id: number
    content: string
    share: boolean
    allow_edit: boolean
    allow_comment: boolean
    allow_share: boolean
    allow_invite: boolean
    allow_join: boolean
    status: string
    owner_id: number
    owner_name: string
    owner_avatar: string
    owner_email: string
    [key: string]: any
}

export interface NoteCategory {
    id: number
    category_name: string
    total: number
}