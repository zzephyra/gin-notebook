import axiosClient from "@/lib/api/client";
import { registerApi, verificationCodeApi } from "./routes";

interface RegisterParams {
    email: string;
    password: string;
    code: string;
}

interface CaptchasParams {
    email: string;
}

export async function registerUser(data: RegisterParams) {
    let rsp = await axiosClient.post(registerApi, data);
    return rsp.data;
}

export async function sendCode(data: CaptchasParams) {
    let rsp = await axiosClient.post(verificationCodeApi, data);
    return rsp.data;
}