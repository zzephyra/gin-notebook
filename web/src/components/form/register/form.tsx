import { useState, FormEvent, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button, PressEvent } from "@heroui/button";
import { Form } from "@heroui/form";
import { Trans as TransMacro, useLingui } from "@lingui/react/macro";
import { Link } from "react-router-dom";
import { addToast } from "@heroui/react";
import { sendCode } from "@/features/api/register";
import { responseCode } from "@/features/constant/response";
// 定义 props 类型
interface RegisterFormProps {
    onSubmit: (email: string, code: string, password: string) => void;
}
export const RegisterForm = ({ onSubmit }: RegisterFormProps) => {
    const [errors, setErrors] = useState({});
    const [emailValue, setEmailValue] = useState('');
    const [second, setSecond] = useState(0);
    const [isActive, setActive] = useState(true);
    var { t } = useLingui()

    useEffect(() => {
        if (second > 0) {
            const timer = setTimeout(() => {
                setSecond(second - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setActive(true);
        }
    }, [second]);
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        if (!data.email) {
            setErrors({ email: t`Please enter your email address.` });
            return;
        }

        if (!data.code) {
            setErrors({ code: t`Please enter the verification code.` });
            return;
        }

        if (!data.password) {
            setErrors({ password: t`Please enter your password.` });
            return;
        }
        onSubmit(
            data.email as string,
            data.code as string,
            data.password as string,
        );
    };


    const handleSendCode = async (e: PressEvent) => {
        const data = new FormData();
        if (emailValue == null || emailValue == "") {
            setErrors({ email: "请填写邮箱" });
            return;
        }
        data.append("email", emailValue);
        setActive(false);
        setSecond(60);
        const res = await sendCode({ email: emailValue });
        if (res.code == responseCode.SUCCESS) {
            addToast({
                title: t`Verification code has been sent.`,
                description: t`Please check your email.`,
                color: "success",
            });
        } else {
            addToast({
                title: t`Verification code failed to send.`,
                description: "请查收邮件",
                color: "danger",
            });
        }
    };

    return (
        <Form onSubmit={handleSubmit} validationErrors={errors}>
            <Input className="py-2" label="Email" type="email" value={emailValue} id="email" name="email" onChange={(e) => setEmailValue(e.target.value)} />
            <div className="flex flex-row gap-2 py-2 w-full test">
                <div className="min-w-0 flex-[3_3_0%]">
                    <Input label="Code" type="text" id="code" name="code" />
                </div>
                <Button className="min-w-0 h-full flex-1" onPress={handleSendCode} color="primary" isDisabled={!isActive}>
                    {isActive ? <TransMacro>Send Code</TransMacro> : <span><TransMacro>Sent</TransMacro> ({second} s)</span>}
                </Button>
            </div>
            <Input className="py-2" label="Password" type="password" id="password" name="password" />
            <Button color="primary" className="w-full my-2" type="submit">
                <TransMacro>Sign Up</TransMacro>
            </Button>
            <p className="text-center">
                <TransMacro>Already have an account?</TransMacro> <Link to="/auth/login">Sign in</Link>
            </p>
        </Form>
    );
};