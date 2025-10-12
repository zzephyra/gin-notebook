import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import LoginPage from "../pages/auth/login";
import BaseSimplePage from "../layouts/base";
import RegisterPage from "@/pages/auth/register";
import RequireAuth from "./RequireAuth";
import BaseLayout from "@/layouts/backstage";
import SelectWorkspace from "@/pages/workspace/select";
import WorkspaceNote from "@/pages/workspace/note";
import InviteWorkspacePage from "@/pages/workspace/invite";
import FavoritesPage from "@/pages/workspace/favorites";
import TasksPage from "@/pages/workspace/tasks";
import ProjectPage from "@/pages/workspace/project";

const SettingsLayout = lazy(() => import("@/layouts/SettingsLayout"));
const AccountSettings = lazy(() => import("@/pages/settings/accountSettings"));
const IntegrationAccount = lazy(() => import("@/pages/settings/integrationAccount"));
const WorkspaceSettings = lazy(() => import("@/pages/settings/workspaceSettings"));
const StorageSettings = lazy(() => import("@/pages/settings/storageSettings"));
const IntegrationSetting = lazy(() => import("@/pages/settings/integrationSetting"));

export let router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        <BaseLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, Component: LoginPage },
      { path: "workspace/:id", Component: WorkspaceNote },
      { path: "workspace/:id/favorites", Component: FavoritesPage },
      {
        path: "settings/:id",
        element: (
          <Suspense fallback={<div className="px-4 py-2 text-sm text-gray-500">Loading settings…</div>}>
            <SettingsLayout />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<div className="px-4 py-2 text-sm text-gray-500">Loading account…</div>}>
                <AccountSettings />
              </Suspense>
            ),
          },
          {
            path: "account",
            element: (
              <Suspense fallback={<div className="px-4 py-2 text-sm text-gray-500">Loading account…</div>}>
                <AccountSettings />
              </Suspense>
            ),
          },
          {
            path: "bind",
            element: (
              <Suspense fallback={<div className="px-4 py-2 text-sm text-gray-500">Loading integration account…</div>}>
                <IntegrationAccount />
              </Suspense>
            ),
          },
          {
            path: "members",
            element: (
              <Suspense fallback={<div className="px-4 py-2 text-sm text-gray-500">Loading members…</div>}>
                <WorkspaceSettings />
              </Suspense>
            ),
          },
          {
            path: "storage",
            element: (
              <Suspense fallback={<div className="px-4 py-2 text-sm text-gray-500">Loading storage…</div>}>
                <StorageSettings />
              </Suspense>
            ),
          },
          {
            path: "integration",
            element: (
              <Suspense fallback={<div className="px-4 py-2 text-sm text-gray-500">Loading integration…</div>}>
                <IntegrationSetting />
              </Suspense>
            ),
          },
        ],
      },
      { path: "tasks/:id", Component: TasksPage },
      { path: "project/:id", Component: ProjectPage },
    ],
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <BaseSimplePage />
      </RequireAuth>
    ),
    children: [
      { path: "select", Component: SelectWorkspace },
      { path: "invite/:id", Component: InviteWorkspacePage },
    ],
  },

  {
    path: "/auth",
    Component: BaseSimplePage,
    children: [
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
    ],
  },
]);

function AppRouter() {
  return <RouterProvider router={router}></RouterProvider>;
}

export default AppRouter;
