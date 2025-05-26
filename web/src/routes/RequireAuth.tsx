import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { store } from '@/store';

const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const state = store.getState();
  const isAuth = state.user.isAuth;
  const location = useLocation();

  // 此处代码为简单示例，具体判断方式根据业务需求具体实现，在Login页面登录成功后将此处置为true
  if (isAuth === false) {
    // 如果用户未登录，重定向到登录页面，并携带当前路由信息
    // 以便登录后可以重定向回原页面
    const redirectPath = location.pathname + location.search + location.hash;
    return <Navigate to={`/auth/login?redirect=${encodeURIComponent(redirectPath)}`} state={{ ...(location.state || {}), from: location }}></Navigate>;
  }

  return children;
};

export default RequireAuth;
