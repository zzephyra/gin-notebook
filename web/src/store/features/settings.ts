import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/** settings 模块的状态类型 */
export interface SettingsState {
    user: Record<string, any>
    system: Record<string, any>

    // ⭐ 关键：允许任意附加键
    [key: string]: any
}

/** 初始值也记得显式声明类型，保证和接口保持一致 */
const initialState: SettingsState = {
    user: {},
    system: {}
}

export const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setSettings(state, action: PayloadAction<Partial<SettingsState>>) {
            Object.assign(state, action.payload)
        }
    }
})

export const { setSettings } = settingsSlice.actions

// Other code such as selectors can use the imported `RootState` type  
export default settingsSlice.reducer