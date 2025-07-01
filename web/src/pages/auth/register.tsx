import { ToastProvider, Image } from "@heroui/react";
import { RegisterForm } from "@/components/form/register/form";
import { useLingui } from "@lingui/react/macro";
import { responseCode } from "@/features/constant/response";
import { useNavigate } from "react-router-dom";
import LogoInmage from "@/assets/images/logo/logo.png"

export default function RegisterPage() {
    const { t } = useLingui();
    const navigate = useNavigate();
    const OnSubmitRegister = async (email: string, code: string, password: string) => {
        const { registerUser } = await import('@/features/api/register');
        const { addToast } = await import("@heroui/react");

        try {
            const rsp = await registerUser({ email, code, password });
            if (rsp.code == responseCode.SUCCESS) {
                addToast({
                    title: t`Register success`,
                    description: t`Register success, please check your email`,
                    color: "success",
                });
                navigate('/auth/login'); // 跳转到登录页面
                return;
            } else {
                addToast({
                    title: t`Register failed`,
                    description: rsp.error,
                    color: "danger",
                });
                return;
            }
        } catch (err) {
            addToast({
                title: t`Register failed`,
                description: t`Register failed, please check your email and password`,
                color: "danger",
            });
        }
    }

    return (
        <div className="w-96 m-auto	h-full justify-center flex flex-col content-center">
            <ToastProvider placement="top-left" />
            <div className="w-full flex justify-center mb-4">
                <Image className="w-48" src={LogoInmage}></Image>
            </div>
            <RegisterForm onSubmit={OnSubmitRegister}></RegisterForm>

        </div>
    )
}