import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom';
import HomePage from '../pages/index';
import LoginPage from '../pages/auth/login';
import BaseLoginPage from '../layouts/base';
import RegisterPage from '@/pages/auth/register';
import RequireAuth from './RequireAuth';
let router = createBrowserRouter([
    {
        path: "/",
        element: (
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          ),
        children: [
            {   
                path:"login",
                index: true,
                Component: LoginPage,
            },
        ]
    },
    {
        path: "/auth",
        Component: BaseLoginPage,
        children: [
            {   
                path:"login",
                index: true,
                Component: LoginPage,
            },
            {
                path: "register",
                Component: RegisterPage,
            }
        ]
    }
  ]);

function AppRouter() {
  return <RouterProvider router={router}></RouterProvider>
}

export default AppRouter;