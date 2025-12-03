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
import AISettings from "@/pages/settings/aiSettings";

const SettingsLayout = lazy(() => import("@/layouts/SettingsLayout"));
const AccountSettings = lazy(() => import("@/pages/settings/accountSettings"));
const IntegrationAccount = lazy(() => import("@/pages/settings/integrationAccount"));
const WorkspaceSettings = lazy(() => import("@/pages/settings/workspaceSettings"));
const StorageSettings = lazy(() => import("@/pages/settings/storageSettings"));
const IntegrationSetting = lazy(() => import("@/pages/settings/integrationSetting"));
const PromptsSettings = lazy(() => import("@/pages/settings/promptSettings"));
const HomePage = lazy(() => import("@/pages/exterior/main"));

export let router = createBrowserRouter([
  {
    element: (
      <RequireAuth>
        <BaseLayout />
      </RequireAuth>
    ),
    children: [
      { path: "/favorites/:id", Component: FavoritesPage },
      { path: "/workspace/:id", Component: WorkspaceNote },
      {
        path: "/settings/:id",
        element: (
          <Suspense fallback={<div className="px-4 py-2 text-sm text-gray-500">Loading settings…</div>}>
            <SettingsLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <AccountSettings /> },
          { path: "account", element: <AccountSettings /> },
          { path: "bind", element: <IntegrationAccount /> },
          {
            path: "members",
            element: (
              <WorkspaceSettings />
            ),
          },
          {
            path: "storage",
            element: (
              <StorageSettings />
            ),
          },
          {
            path: "prompts",
            element: (
              <PromptsSettings />
            ),
          },
          {
            path: "integration",
            element: (
              <IntegrationSetting />
            ),
          },
          {
            path: "ai",
            element: (
              <AISettings />
            )
          }
        ],
      },

      { path: "/tasks/:id", Component: TasksPage },
      { path: "/project/:id", Component: ProjectPage },
    ],
  },

  // “Simple” layout as a pathless parent with absolute children
  {
    element: (
      <RequireAuth>
        <BaseSimplePage />
      </RequireAuth>
    ),
    children: [
      { path: "/select", Component: SelectWorkspace },
      { path: "/invite/:id", Component: InviteWorkspacePage },
    ],
  },

  // Auth routes (separate branch)
  {
    path: "/auth",
    Component: BaseSimplePage,
    children: [
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
    ],
  },
  {
    path: "",
    children: [
      { index: true, path: "/", element: <HomePage /> },
    ]
  }
]);

function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
