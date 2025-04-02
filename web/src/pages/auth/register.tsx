import { Button, ToastProvider, addToast } from "@heroui/react";
import { RegisterForm } from "@/components/form/register/form";
import { Trans as TransMacro, useLingui } from "@lingui/react/macro";

const OnSubmitRegister = async (email: string, code: string, password: string) => {
    const { registerUser } = await import('@/features/api/register');
    const { addToast } = await import("@heroui/react");
    const { t } = useLingui();
    try {
        const rsp = await registerUser({ email, code, password });
        addToast({
            title: t`Register success`,
            description: t`Register success, please check your email`,
        });
    } catch (err) {
        addToast({
            title: t`Register failed`,
            description: t`Register failed, please check your email and password`,
        });
    }
}

export default function RegisterPage() {    
    return (
        <div className="w-96 m-auto	h-full justify-center flex flex-col content-center">
        <ToastProvider placement="top-left" />
        <p className='font-bold text-center text-4xl pb-2'>Memoas</p>
        <RegisterForm onSubmit={OnSubmitRegister}></RegisterForm>
        {/* <p><TransMacro>Don't have an account yet?</TransMacro> <Link to="/auth/register">Sign up</Link></p> */}

    </div>
    )
}