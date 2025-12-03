import { responseCode } from '@/features/constant/response';
import { router } from '@/routes';
import { i18n } from '@lingui/core';
import axios from 'axios';
import toast from 'react-hot-toast';

// 初始化拦截器

// 通过环境变量配置基础URL（需在 .env 中定义）
export const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8899/api/v1';

const axiosClient = axios.create({
  baseURL: BASE_URL, // 自动添加前缀
  timeout: 10000,
  withCredentials: true, // 允许携带凭证
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.response.use(
  (response) => {
    if (response.data.code && response.data.code != responseCode.SUCCESS && !response.config.suppressToast) {
      // 如果接口报错，则默认提示错误信息
      toast.error(response.data.error || i18n._('Sorry, something went wrong'));
    }
    return response;
  },
  (error) => {
    const location = window.location.pathname;
    const publicPaths = ['/auth', "/"];

    const isPublicPath = publicPaths.some(path => {
      if (path === '/' || path === '') {
        return window.location.pathname === '/' || window.location.pathname === '';
      }
      return window.location.pathname.startsWith(path);
    });

    if (!isPublicPath) {
      if (error.response == undefined) {
        toast.error(i18n._('Network error, please check your connection.'));
      } else if (error.response.data.code == responseCode.ERROR_NO_PERMISSION_TO_UPDATE_AND_VIEW_WORKSPACE) {
        router.navigate('/select');
        toast.error(i18n._("You don't have permission to view or update this workspace."));
      } else if (error.response?.status === 401) {
        router.navigate(`/auth/login?redirect=${encodeURIComponent(location)}`);
        toast.error(i18n._('Please log in to continue.'));
      }
    }

    return Promise.reject(error);
  }
);
export default axiosClient;