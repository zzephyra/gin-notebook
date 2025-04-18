import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Note } from '@/pages/workspace/type'

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

export interface CategoryItem {
    id: number
    category_name: string
    total: number
}




export interface WorkspaceState {
    workspaceList: WorkspaceItem[],
    currentWorkspace: WorkspaceItem | null,
    categoryList: CategoryItem[],
    noteList: Note[],
}

const initialState: WorkspaceState = {
    workspaceList: [],
    currentWorkspace: null,
    categoryList: [],
    noteList: [],
};

export const workspaceSlice = createSlice({
    name: 'workspace',
    initialState: initialState,

    reducers: {
        UpdateWorkspaceList: (state, action: PayloadAction<{ workspaces: WorkspaceItem[] }>) => {
            state.workspaceList = action.payload.workspaces
        },
        UpdateCurrentWorkspace: (state, action: PayloadAction<WorkspaceItem>) => {
            state.currentWorkspace = action.payload
        },
        UpdateNoteCategoryList: (state, action: PayloadAction<CategoryItem[]>) => {
            state.categoryList = action.payload
        },
        UpdateNoteList: (state, action: PayloadAction<Note[]>) => {
            state.noteList = action.payload
        },
        UpdateNoteByID: (state, action: PayloadAction<{ id: number, data: Object }>) => {
            const index = state.noteList.findIndex(note => note.id === action.payload.id);
            if (index !== -1) {
                state.noteList[index] = {
                    ...state.noteList[index],
                    ...action.payload.data,
                };
            }
        },
        UpdateCategoryByID: (state, action: PayloadAction<{ id: number, data: Object }>) => {
            const index = state.categoryList.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.categoryList[index] = {
                    ...state.categoryList[index],
                    ...action.payload.data,
                };
            }
        }
    }
})

export const { UpdateWorkspaceList, UpdateCurrentWorkspace, UpdateNoteCategoryList, UpdateNoteList, UpdateNoteByID, UpdateCategoryByID } = workspaceSlice.actions

// Other code such as selectors can use the imported `RootState` type  
export default workspaceSlice.reducer