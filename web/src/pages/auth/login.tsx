import { Link, useNavigate } from "react-router-dom";
import { loginUserApi, LoginParams } from "@/features/api/login";
import { getUserInfoRequest, storageUserDeviceRequest } from "@/features/api/user";
import { addToast, Button, ToastProvider, Image } from "@heroui/react";
import { LoginForm } from "@/components/form/login/form";
import LogoInmage from "@/assets/images/logo/logo.png"
import "@/styles/login.css";
import { store } from "@/store";
import { Trans as TransMacro, useLingui } from "@lingui/react/macro";
import { useGoogleLogin } from '@react-oauth/google';
import { responseCode } from "@/features/constant/response";
import { getSettingsRequest } from "@/features/api/settings";
import GoogleIcon from "@/components/icons/google";
import QQIcon from "@/components/icons/qq";

export default function LoginPage() {
  const navigate = useNavigate();
  // const { login } = useAuth();
  const { t } = useLingui();
  const setGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const setQQAppId = Boolean(import.meta.env.VITE_QQ_APP_ID);
  const handleLogin = async (params: LoginParams) => {
    try {
      const { code, error } = await loginUserApi(params);
      if (code == responseCode.SUCCESS) {
        await getUserInfoRequest();
        await getSettingsRequest({})
        await storageUserDeviceRequest()
        const state = store.getState();
        const isAuth = state.user.isAuth;
        if (isAuth) {
          const redirect = new URLSearchParams(location.search).get("redirect") || "/select";
          navigate(redirect); // 跳转到仪表盘或其他页面
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

  const handleGoogleLogin = async (tokenResponse: any) => {
    handleLogin({ channel: "google", googleToken: tokenResponse.access_token });
  }
  let googleLogin: (() => void) | null = null;

  if (setGoogleClientId) {
    googleLogin = useGoogleLogin({
      onSuccess: tokenResponse => handleGoogleLogin(tokenResponse),
    });
  }

  const handleEmailLogin = (email: string, password: string) => {
    handleLogin({ email, password, channel: "email" });
  }

  const handleQQLogin = () => {
    window.open(
      `https://graph.qq.com/oauth2.0/authorize??response_type=code&client_id=${import.meta.env.VITE_QQ_APP_ID}&redirect_uri=${import.meta.env.VITE_QQ_REDIRECT_URI}&state=STATE`,)
  }


  return (
    <div className="w-96 m-auto	h-full justify-center flex flex-col content-center">
      <ToastProvider placement="top-left" />
      <div className="w-full flex justify-center mb-4">
        <Image className="w-48" src={LogoInmage}></Image>
      </div>
      <LoginForm onSubmit={handleEmailLogin} />
      <p>
        <TransMacro>Don't have an account yet?</TransMacro>{" "}
        <Link to="/auth/register">Sign up</Link>
      </p>
      <div className="line py-2 text-center">
        <TransMacro>Or</TransMacro>
      </div>
      <div className="flex">

        {
          setGoogleClientId && (
            <div className="flex-1 flex justify-center">
              <Button
                variant="flat"
                radius="full"
                className="bg-slate-100 "
                isIconOnly
                onPress={handleQQLogin}
              >
                <QQIcon className="w-4" />
              </Button>
            </div>
          )
        }
        {
          setQQAppId && (
            <div className="flex-1 flex justify-center">
              <Button
                variant="flat"
                radius="full"
                className="bg-slate-100 "
                isIconOnly
                onPress={() => googleLogin && googleLogin()}
              >
                <GoogleIcon className="w-4" />
              </Button>
            </div>
          )
        }
      </div>
    </div>
  );
}
