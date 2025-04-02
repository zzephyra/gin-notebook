import axiosClient from './client';

export const setupRequestInterceptors = () => {
  axiosClient.interceptors.request.use(
    (config) => {
    //   const token = getToken(); // 从 localStorage 或 cookie 获取
      const token = localStorage.getItem('token'); // 示例：从 localStorage 获取 token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

export const setupResponseInterceptors = () => {
    axiosClient.interceptors.response.use(
      (response) => response.data, // 直接返回核心数据
      (error) => {
        const { response } = error;
        
        // 处理 HTTP 状态码
        if (response) {
          switch (response.status) {
            case 401:
              // Token 过期，跳转登录
              window.location.href = '/login';
              break;
            case 403:
              alert('无权访问此资源');
              break;
            case 500:
              alert('服务器内部错误');
              break;
            default:
              alert(`请求错误：${response.status}`);
          }
        } else if (error.request) {
          alert('网络异常，请检查连接');
        } else {
          alert('请求配置错误');
        }
  
        return Promise.reject(error);
      }
    );
  };