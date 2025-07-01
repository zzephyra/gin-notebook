import { createSlice, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit'
import { Note } from '@/pages/workspace/type'

export interface WorkspaceItem {
    id: string,
    name: string,
    description: string,
    owner: string,
    created_at: string,
    owner_name: string,
    owner_avatar: string,
    owner_email: string,
    roles: string[],
    avatar: string,
    memberCount: number,
    [key: string]: any
}


export interface CategoryItem {
    id: string
    category_name: string
    total: number
}


export const notesAdapter = createEntityAdapter<Note>();

export interface WorkspaceState {
    workspaceList: WorkspaceItem[],
    currentWorkspace: WorkspaceItem | null,
    categoryList: CategoryItem[],
    // noteList: Note[],
    noteList: ReturnType<typeof notesAdapter.getInitialState>
    selectedNoteId: string | null
}

const initialState: WorkspaceState = {
    workspaceList: [],
    currentWorkspace: null,
    categoryList: [],
    selectedNoteId: null,
    // noteList: [],
    noteList: notesAdapter.getInitialState(),
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
        setSelectedNoteId(state, { payload }) {
            state.selectedNoteId = payload;
        },
        CleanWorkspaceState: (state) => {
            state.workspaceList = [];
            state.currentWorkspace = null;
            state.categoryList = [];
            state.selectedNoteId = null;
            notesAdapter.removeAll(state.noteList);
        },
        UpdateNoteList: (state, action: PayloadAction<Note[]>) => {
            notesAdapter.addMany(state.noteList, action.payload);
        },
        UpdateNoteByID: (state, action: PayloadAction<{ id: string; changes: Partial<Note> }>) => {
            notesAdapter.updateOne(state.noteList, action.payload);
        },
        DeleteNoteByID: (state, action: PayloadAction<string>) => {
            notesAdapter.removeOne(state.noteList, action.payload);
        },
        UpdateCategoryByID: (state, action: PayloadAction<{ id: string, data: Object }>) => {
            const index = state.categoryList.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.categoryList[index] = {
                    ...state.categoryList[index],
                    ...action.payload.data,
                };
            }
        },
        InsertNewCategory: (state, action: PayloadAction<CategoryItem>) => {
            const index = state.categoryList.findIndex(c => c.id === action.payload.id);
            if (index === -1) {
                state.categoryList.push(action.payload);
            } else {
                state.categoryList[index] = {
                    ...state.categoryList[index],
                    ...action.payload,
                };
            }
        }
    }
})

export const { UpdateWorkspaceList, CleanWorkspaceState, DeleteNoteByID, InsertNewCategory, UpdateCurrentWorkspace, setSelectedNoteId, UpdateNoteCategoryList, UpdateNoteList, UpdateNoteByID, UpdateCategoryByID } = workspaceSlice.actions

// Other code such as selectors can use the imported `RootState` type  
export default workspaceSlice.reducer