// features/auth/api/login.ts
import axiosClient from '@/lib/api/client';
import { loginApi } from './routes';

type LoginParams = {
  email: string;
  password: string;
};

type LoginResponse = {
    code: number;
    error?: string;
};

export const loginUserApi = async (params: LoginParams): Promise<LoginResponse> => {
  const response = await axiosClient.post(loginApi, params);
  return response.data;
};