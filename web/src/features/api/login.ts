// features/auth/api/login.ts
import axiosClient from '@/lib/api/client';
import { loginApi } from './routes';

export type LoginParams = {
  email?: string;
  password?: string;
  channel: string; // e.g., 'email', 'google'
  googleToken?: string; // Required if channel is 'google'
};

type LoginResponse = {
  code: number;
  error?: string;
};

export const loginUserApi = async (params: LoginParams): Promise<LoginResponse> => {
  const response = await axiosClient.post(loginApi, params);
  return response.data;
};