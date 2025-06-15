import { Outlet, useNavigate } from "react-router-dom";
import SiderBar from "@/components/menu/sidebar";
import { useEffect } from "react";
import { GetWorkspace } from "@/features/api/workspace";
import { useParams } from "react-router-dom";
import { UpdateCurrentWorkspace } from "@/store/features/workspace";
import { store } from "@/store";
import { useMediaQuery } from 'react-responsive';

export default function BaseLayout() {
  let params = useParams();
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  let navigate = useNavigate();
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

  return (
    <div className="flex h-full">
      {isDesktop && <SiderBar ></SiderBar>}

      <Outlet />
    </div>
  );
}
