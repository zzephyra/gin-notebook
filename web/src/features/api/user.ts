import axiosClient from "@/lib/api/client";
import { userInfoApi } from "./routes";
import { InitUserInfo, UpdateUserInfo } from '@/store/features/user'
import { store } from '@/store';
import { responseCode } from "../constant/response";
import { checkFileType } from "@/utils/tools";
import toast from "react-hot-toast";
import { i18n } from "@lingui/core"

interface UserInfoResponse {
    code: number;
    data?: Map<string, any>;
    error?: string;
};

interface UseUpdateParams {
    nickname: string | null | undefined;
    email: string | null | undefined;
    password: string | null | undefined;
    phone: string | null | undefined;
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

export async function updateInfoRequest(data: Partial<UseUpdateParams>) {
    const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value != null) // 过滤掉 null 和 undefined
    );
    try {
        let res = await axiosClient.post(userInfoApi, cleanedData)
        if (res.data.code == responseCode.SUCCESS) {
            store.dispatch(UpdateUserInfo(cleanedData))
            return true
        }
        return false
    } catch (err) {
        return false
    }
}

export async function uploadUserAvatarRequest(avatar: File) {
    let isImage = checkFileType(avatar, 'image')
    if (!isImage) {
        toast.error(i18n._('Only image types are supported.'))
        return
    }
}