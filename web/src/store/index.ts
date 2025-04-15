import { configureStore } from '@reduxjs/toolkit'
import userReducer from './features/user'
import workspaceReducer from './features/workspace'

export const store = configureStore({
  reducer: {
    user: userReducer,
    workspace: workspaceReducer
  }
})

// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store