import axiosClient from "@/lib/api/client";
import { userInfoApi } from "./routes";
import { InitUserInfo, UpdateUserInfo } from '@/store/features/user'
import { store } from '@/store';
import { responseCode } from "../constant/response";

interface UserInfoResponse {
    code: number;
    data?: Map<string, any>;
    error?: string;
};

interface UseUpdateParams {
    nickname: string;
    email: string;
    password: string;
    avatar: string;
    phone: string;
}

export async function getUserInfoRequest(): Promise<UserInfoResponse> {
    try {
        let res = await axiosClient.get(userInfoApi, {});
        if (res.data.code === responseCode.SUCCESS) {
            store.dispatch(InitUserInfo(res.data.data));
        }
        return res.data;
    } catch (err) {
        return {
            code: responseCode.ERROR,
            error: "Get user info failed"
        }
    }
}

export async function updateInfoRequest(userID: string, data: Partial<UseUpdateParams>) {
    if (!userID) {
        console.error("User ID is required");
        return false
    }
    const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value != null) // 过滤掉 null 和 undefined
    );
    try {
        let res = await axiosClient.post(`${userInfoApi}/${userID}`, cleanedData)
        if (res.data.code == responseCode.SUCCESS) {
            store.dispatch(UpdateUserInfo(cleanedData))
            return true
        }
        return false
    } catch (err) {
        return false
    }
}
