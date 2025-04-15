import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface WorkspaceItem {
    id: number,
    name: string,
    description: string,
    owner: number,
    created_at: string,
    owner_name: string,
    owner_avatar: string,
    owner_email: string,
    [key: string]: any
}
export interface WorkspaceState {
    workspaceList: WorkspaceItem[],
    currentWorkspace: WorkspaceItem | null,
}

const initialState: WorkspaceState = {
    workspaceList: [],
    currentWorkspace: null,
};

export const workspaceSlice = createSlice({
    name: 'workspace',
    initialState: initialState,

    reducers: {
        UpdateWorkspaceList: (state, action: PayloadAction<{ workspaces: WorkspaceItem[] }>) => {
            console.log("UpdateWorkspaceList", action.payload.workspaces)
            state.workspaceList = action.payload.workspaces
        },
        UpdateCurrentWorkspace: (state, action: PayloadAction<WorkspaceItem>) => {
            state.currentWorkspace = action.payload
        }
    }
})

export const { UpdateWorkspaceList, UpdateCurrentWorkspace } = workspaceSlice.actions

// Other code such as selectors can use the imported `RootState` type  
export default workspaceSlice.reducer