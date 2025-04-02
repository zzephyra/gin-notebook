import { createBrowserRouter, RouterProvider, BrowserRouter, Link, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/index';
import LoginPage from '../pages/auth/login';
import BaseLoginPage from '../layouts/base';
import RegisterPage from '@/pages/auth/register';

let router = createBrowserRouter([
    {
        path: "/",
        Component: HomePage,
    },
    {
        path: "/auth",
        Component: BaseLoginPage,
        children: [
            {   
                path:"login",
                index: true,
                // loader: homeLoader,
                Component: LoginPage,
            },
            {
                path: "register",
                // loader: homeLoader,
                Component: RegisterPage,
            }
        ]
    }
  ]);

function AppRouter() {
  return <RouterProvider router={router} />
}

export default AppRouter;