import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface DeviceInfo {
    fingerprint: string;
    os: string;
    device: string;
    ua: string;
}


export interface UserState {
    email: string,
    nickname: string,
    phone: string,
    role: [], // e.g: ["admin", "user"]
    avatar: string,
    isAuth: boolean,
    id: string,
    device: Partial<DeviceInfo>,
}

const updatableKeys = ['email', 'nickname', 'phone', 'role', 'avatar', 'device'] as const
type UpdatableKey = typeof updatableKeys[number]
type UpdatePayload = Partial<Pick<UserState, UpdatableKey>>

var initialState: UserState = {
    email: "",
    nickname: "",
    phone: "",
    role: [], // e.g: ["admin", "user"]
    isAuth: false,
    avatar: "",
    id: "",
    device: {},
}
export const userSlice = createSlice({
    name: 'userInfo',
    initialState,
    reducers: {
        InitUserInfo: (state, action: PayloadAction<UserState>) => {
            state.email = action.payload.email
            state.nickname = action.payload.nickname
            state.phone = action.payload.phone
            state.role = action.payload.role
            state.avatar = action.payload.avatar
            state.id = action.payload.id
            state.isAuth = true
        },
        UpdateAuthState: (state, action: PayloadAction<{ isAuth: boolean }>) => {
            state.isAuth = action.payload.isAuth
        },
        Logout: (state) => {
            state.email = ""
            state.nickname = ""
            state.phone = ""
            state.id = ""
            state.role = []
            state.avatar = ""
            state.device = {}
            state.isAuth = false
        },
        UpdateUserInfo: (
            state,
            action: PayloadAction<UpdatePayload>
        ) => {
            updatableKeys.forEach((key) => {
                const value = action.payload[key]
                if (value !== undefined) {
                    state[key] = value as any
                }
            })
        }
    }
})

export const { InitUserInfo, UpdateAuthState, Logout, UpdateUserInfo } = userSlice.actions

// Other code such as selectors can use the imported `RootState` type  
export default userSlice.reducer