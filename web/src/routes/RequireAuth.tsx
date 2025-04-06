import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { store } from '@/store';

const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
     const state = store.getState();
    const isAuth = state.user.isAuth; 
  const location = useLocation();
  // 此处代码为简单示例，具体判断方式根据业务需求具体实现，在Login页面登录成功后将此处置为true
  if (isAuth === false) {
    return <Navigate to={'/login' + (location.search || '')} state={{ ...(location.state || {}), from: location }}></Navigate>;
  }

  return children;
};

export default RequireAuth;
