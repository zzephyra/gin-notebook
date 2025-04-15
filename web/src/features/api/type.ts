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
}