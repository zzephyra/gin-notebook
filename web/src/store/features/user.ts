import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserState {
    email: string,
    nickname: string,
    phone: string,
    roles: [], // e.g: ["admin", "user"]
}

export const userSlice = createSlice({
    name: 'userInfo',
    initialState: {
        email: "",
        nickname: "",
        phone: "",
        roles: [], // e.g: ["admin", "user"]
        isAuth: false,
    },
    reducers: {
        UpdateUserInfo: (state, action: PayloadAction<UserState>) => {
            state.email = action.payload.email
            state.nickname = action.payload.nickname
            state.phone = action.payload.phone
            state.roles = action.payload.roles
            state.isAuth = true
            console.log("UpdateUserInfo", state)
        },
        UpdateAuthState: (state, action: PayloadAction<{isAuth: boolean}>) => {
            state.isAuth = action.payload.isAuth
        }
    }
  })
  
  export const { UpdateUserInfo, UpdateAuthState } = userSlice.actions
  
  // Other code such as selectors can use the imported `RootState` type  
  export default userSlice.reducer