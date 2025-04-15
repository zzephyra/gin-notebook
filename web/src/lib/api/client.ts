import { responseCode } from '@/features/constant/response';
import axios from 'axios';
import toast from 'react-hot-toast';

// 初始化拦截器

// 通过环境变量配置基础URL（需在 .env 中定义）
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8899/api/v1';

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
    if (response.data.code != responseCode.SUCCESS) {
      // 如果接口报错，则默认提示错误信息
      toast.error(response.data.error || 'Sorry, something went wrong');
    }
    return response;
  },
  (error) => {
    // 统一处理错误，返回固定结构
    return Promise.resolve({
      data: {
        error: 'Service Error',
        code: 500,
      },
    });
  }
);
export default axiosClient;