import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserState {
    email: string,
    nickname: string,
    phone: string,
    roles: [], // e.g: ["admin", "user"]
    avatar: string,
    id: number,
}

export const userSlice = createSlice({
    name: 'userInfo',
    initialState: {
        email: "",
        nickname: "",
        phone: "",
        roles: [], // e.g: ["admin", "user"]
        isAuth: false,
        avatar: "",
        id: 0,
    },
    reducers: {
        UpdateUserInfo: (state, action: PayloadAction<UserState>) => {
            state.email = action.payload.email
            state.nickname = action.payload.nickname
            state.phone = action.payload.phone
            state.roles = action.payload.roles
            state.avatar = action.payload.avatar
            state.id = action.payload.id
            state.isAuth = true
        },
        UpdateAuthState: (state, action: PayloadAction<{isAuth: boolean}>) => {
            state.isAuth = action.payload.isAuth
        },
        Logout: (state) => {
            console.log("Logout")
            state.email = ""
            state.nickname = ""
            state.phone = ""
            state.roles = []
            state.avatar = ""
            state.isAuth = false
        }
    }
  })
  
  export const { UpdateUserInfo, UpdateAuthState, Logout } = userSlice.actions
  
  // Other code such as selectors can use the imported `RootState` type  
  export default userSlice.reducer