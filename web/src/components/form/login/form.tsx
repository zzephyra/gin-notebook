import { useState, FormEvent } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Trans as TransMacro } from "@lingui/react/macro";
import { Checkbox } from "@heroui/react";
// 定义 props 类型
interface LoginFormProps {
    onSubmit: (email: string, password: string) => void;
}

export const LoginForm = ({ onSubmit }: LoginFormProps) => {
    const [errors, setErrors] = useState({});
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        if (!data.email) {
            setErrors({ email: "请填写邮箱" });
            return;
        }

        if (!data.password) {
            setErrors({ password: "请填写密码" });
            return;
        }
        onSubmit(
            data.email as string,
            data.password as string
        );
    };

    return (
        <Form onSubmit={handleSubmit} validationErrors={errors}>
            <Input className="py-2" label="Email" type="email" id="email" name="email" />
            <Input className="py-2" label="Password" type="password" id="password" name="password" />
            <Checkbox defaultSelected className="py-2" name="remember" id="remember" value="true">
                <TransMacro>Remember me</TransMacro>
            </Checkbox>
            <Button color="primary" className="w-full my-2" type="submit">
                <TransMacro>Sign In</TransMacro>
            </Button>
        </Form>
    );
};