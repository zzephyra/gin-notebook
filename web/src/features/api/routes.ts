export const loginApi: string = "/auth/login";
export const userLogoutApi: string = "/auth/logout";
export const userInfoApi: string = "/user/info";
export const userDeviceApi: string = "/user/device";
export const registerApi: string = "/auth/register";
export const verificationCodeApi: string = "/auth/captchas";
export const workspacesApi: string = "/workspace";
export const workspacesLinkApi: string = "/workspace/link";
export const workspaceLinkJoinApi: string = "/workspace/link/member/";
export const workspacesListApi: string = "/workspace/list";
export const workspaceNotesApi: string = "/workspace/notes/";
export const workspaceMembersApi: string = "/workspace/members";
export const favoriteNoteApi: string = "/note/favorite";
export const workspaceNoteCategoryApi: string = "/workspace/notes/category/";
export const workspaceNoteDeleteApi: string = "/workspace/note/delete/";
export const workspaceCategoryRecommandApi: string = "/workspace/recommend/category/";
export const settingsApi: string = "/settings"
export const systemSettingsApi: string = "/settings/system"
export const uploadPolicyApi: string = "/upload/policy"
export const aiChatApi: string = "/ai/chat";
export const aiChatMessageApi: string = "/ai/message";
export const aiChatHistoryApi: string = "/ai/history";
export const aiChatSessionApi: string = "/ai/session";
export const eventApi: string = "/event";
export const templateNotesApi: string = "/note/templates";
export const templateNoteApi: string = "/note/template";
export const todoTasksApi: string = "/project/task";
export const projectsApi: string = "/project";
export const taskUpdateApi = (taskID: string | number) =>
    `${todoTasksApi}/${taskID}`;
export const taskCommentsApi = (taskID: string | number) =>
    `${todoTasksApi}/${taskID}/comment`;
export const taskCommentWithIDApi = (taskID: string, commentID: string) =>
    `${todoTasksApi}/${taskID}/comment/${commentID}`;
export const taskCommentAttachmentApi = (taskID: string, commentID: string) =>
    `${todoTasksApi}/${taskID}/comment/${commentID}/attachment`;
export const columnApiWithID = (columnID: string) =>
    `/project/column/${columnID}`;

export const taskActivitiesApi = (taskID: string | number) =>
    `/project/task/${taskID}/activities`;

export const taskCommentLikeApi = (taskID: string, commentID: string) =>
    `/project/task/${taskID}/comment/${commentID}/like`
export const websocketApi = (baseUrl: string) => {
    return baseUrl.replace(/^http/, 'ws') + '/realtime/ws';
}
export const projectSettingsApi = (projectID: string) => {
    return `/project/${projectID}/setting`;
}
export const integrationAppApi = "/integration/app";
export const integrationAccountsApi = "/integration/accounts";
export const integrationAccountApi = "/integration/account";
export const feishuCallbackApi = "/integration/feishu/callback";