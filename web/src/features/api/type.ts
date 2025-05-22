export interface ApiResponse<T = any> {
    code: number;
    data?: T;
    error?: string;
}


export type WorkspaceDataType = {
    name: string;
    description: string;
    owner: number;
    created_at: string;
    id: number;
    owner_name: string;
    owner_avatar: string;
    owner_email: string;
    allow_invite: boolean;
    allow_join: boolean;
    allow_public: boolean;
    allow_share: boolean;
    allow_comment: boolean;
    role: string[];
}

export type WorkspaceNoteCreateParams = {
    title: string,
    workspace_id: string,
    category_id: string,
    tags_id?: string,
    status?: string,
    content?: string,
    allow_edit?: boolean,
    allow_invite?: boolean;
    allow_join?: boolean;
    allow_public?: boolean;
    allow_share?: boolean;
    allow_comment?: boolean;
}