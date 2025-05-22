import { Outlet, useNavigate } from "react-router-dom";
import SiderBar from "@/components/menu/sidebar";
import { useLingui } from "@lingui/react/macro";
import SettingIcon from "@/components/icons/setting";
import { useEffect } from "react";
import { GetWorkspace } from "@/features/api/workspace";
import { useParams } from "react-router-dom";
import { UpdateCurrentWorkspace } from "@/store/features/workspace";
import { store } from "@/store";
import { NewspaperIcon } from "@heroicons/react/24/solid";

export default function BaseLayout() {
  const { t } = useLingui();
  let params = useParams();
  let navigate = useNavigate();
  let state = store.getState();
  async function getWorkspaceData() {
    const res = await GetWorkspace({ workspace_id: params.id });
    if (res.data != undefined) {
      store.dispatch(UpdateCurrentWorkspace({
        ...res.data
      }));
    } else {
      navigate("/select");
    }
  }

  useEffect(() => {
    getWorkspaceData()
  }, []);
  const menuItems = [
    {
      label: t`Notes`,
      icon: <NewspaperIcon className="w-6" />,
      key: "notes",
      route: `/workspace/${params.id}`,
    },
    {
      label: t`Settings`,
      icon: <SettingIcon />,
      key: "settings",
      route: `/settings/${params.id}`,
    },
  ];
  return (
    <div className="flex h-full">
      <SiderBar menuItems={menuItems}></SiderBar>
      <Outlet />
    </div>
  );
}
