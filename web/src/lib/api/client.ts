import axios from 'axios';

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
export default axiosClient;