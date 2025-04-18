import { Outlet } from "react-router-dom";
import SiderBar from "@/components/menu/sidebar";
import { useLingui } from "@lingui/react/macro";
import SettingIcon from "@/components/icons/setting";
import TagIcon from "@/components/icons/tag";
import { useEffect, useState } from "react";
import { GetWorkspace } from "@/features/api/workspace";
import { useParams } from "react-router-dom";
import { WorkspaceDataType } from "@/features/api/type";
import { UpdateCurrentWorkspace } from "@/store/features/workspace";
import { store } from "@/store";

export default function BaseLayout() {
  const { t } = useLingui();
  let params = useParams();
  let state = store.getState();
  const { workspace } = state;
  async function getWorkspaceData() {
    const res = await GetWorkspace({ workspace_id: params.id });
    if (res.data != undefined) {
      store.dispatch(UpdateCurrentWorkspace({
        ...res.data
      }));
    }
  }

  useEffect(() => {
    getWorkspaceData()
  }, []);
  const menuItems = [
    {
      label: t`Tag`,
      icon: <TagIcon />,
      key: "tag",
    },
    {
      label: t`Settings`,
      icon: <SettingIcon />,
      key: "settings",
    },
  ];
  return (
    <div className="flex h-full">
      <SiderBar menuItems={menuItems}></SiderBar>
      <Outlet />
    </div>
  );
}
