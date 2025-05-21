import { Link, useNavigate } from "react-router-dom";
import { loginUserApi } from "@/features/api/login";
import { getUserInfoRequest, storageUserDeviceRequest } from "@/features/api/user";
import { addToast, Button, ToastProvider } from "@heroui/react";
import { LoginForm } from "@/components/form/login/form";
import "@/styles/login.css";
import { store } from "@/store";
import { Trans as TransMacro, useLingui } from "@lingui/react/macro";
import GoogleIcon from "@/components/icons/google";
import { responseCode } from "@/features/constant/response";
import { getSettingsRequest } from "@/features/api/settings";

export default function LoginPage() {
  const navigate = useNavigate();
  // const { login } = useAuth();
  const { t } = useLingui();

  const handleLogin = async (email: string, password: string) => {
    try {
      const { code, error } = await loginUserApi({ email, password });

      if (code == responseCode.SUCCESS) {
        await getUserInfoRequest();
        await getSettingsRequest({})
        await storageUserDeviceRequest()
        const state = store.getState();
        const isAuth = state.user.isAuth;
        if (isAuth) {
          navigate("/select"); // 跳转到仪表盘
          return;
        }
      } else {
        addToast({
          title: t`Login failed`,
          description: error,
          color: "danger",
        });
      }
    } catch (err) {
      addToast({
        title: t`Login failed`,
        description: t`Login failed, please check your email and password`,
      });
    }
  };

  return (
    <div className="w-96 m-auto	h-full justify-center flex flex-col content-center">
      <ToastProvider placement="top-left" />
      <p className="font-bold text-center text-4xl pb-2">Memoas</p>
      <LoginForm onSubmit={handleLogin} />
      <p>
        <TransMacro>Don't have an account yet?</TransMacro>{" "}
        <Link to="/auth/register">Sign up</Link>
      </p>
      <div className="line py-2 text-center">
        <TransMacro>Or</TransMacro>
      </div>
      <Button className="w-full" color="secondary" variant="bordered">
        <GoogleIcon size={18}></GoogleIcon> Login with Google
      </Button>
    </div>
  );
}
