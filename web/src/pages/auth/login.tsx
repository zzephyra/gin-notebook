import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '@/features/api/login';
import {addToast, Button, ToastProvider} from "@heroui/react";
import { LoginForm } from '@/components/form/login/form';
import "@/styles/login.css"
import { Trans as TransMacro, useLingui } from "@lingui/react/macro";
import GoogleIcon from '@/components/icons/google';
export default function LoginPage() {
    const navigate = useNavigate();
    // const { login } = useAuth();
    const { t } = useLingui();
    
    const handleLogin = async (email: string, password: string) => {
      try {
        const { token } = await loginUser({ email, password });
        // login(token);
        navigate('/dashboard'); // 跳转到仪表盘
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
            <p className='font-bold text-center text-4xl pb-2'>Memoas</p>
            <LoginForm onSubmit={handleLogin} />
            <p><TransMacro>Don't have an account yet?</TransMacro> <Link to="/auth/register">Sign up</Link></p>
            <div className="line py-2 text-center"><TransMacro>Or</TransMacro></div>
            <Button className="w-full" color="secondary" variant="bordered">
                <GoogleIcon size={18}></GoogleIcon> Login with Google
            </Button>
        </div>
    );
  };