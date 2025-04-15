import axiosClient from "@/lib/api/client";
import { userInfoApi } from "./routes";
import { UpdateUserInfo } from '@/store/features/user'
import { store } from '@/store';
import { responseCode } from "../constant/response";

interface UserInfoResponse {
    code: number;
    data?: Map<string, any>;
    error?: string;
};

export async function getUserInfoApi(): Promise<UserInfoResponse> {
    try{
        let res = await axiosClient.get(userInfoApi, {});
        if (res.data.code === responseCode.SUCCESS) {
            store.dispatch(UpdateUserInfo(res.data.data));
        }
        return res.data;
    }catch (err) {
        return {
            code: responseCode.ERROR,
            error: "Get user info failed"
        }
    }
}