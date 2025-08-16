export type WorkspaceMember = {
    id: string;
    workspace_nickname: string; // The nickname of the user in the workspace
    user_nickname: string; // The nickname of the user in the system
    email: string;
    avatar: string;
    role: string[]; // e.g., 'admin', 'member'
}