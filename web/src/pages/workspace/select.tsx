import {
  Divider,
  Card,
  CardBody,
} from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { WorkspaceItem } from "@/store/features/workspace";
import { useEffect, useState } from "react";
import {
  UpdateWorkspaceList,
} from "@/store/features/workspace";
import { motion } from "motion/react";
import WorkspaceSelctList from "@/components/list/workspaceEntry/list";
import WorkspaceInitStep from "@/components/step/workspace/main";
import { store } from "@/store";
import ChaseLoading from "@/components/loading/Chase/loading";
import { getWorkspaceListRequest } from "@/features/api/workspace";
import { responseCode } from "@/features/constant/response";

export default function InitWorkspace() {
  const state = store.getState();
  const { workspace, user } = state;
  const { t } = useLingui();
  const [loading, setLoading] = useState(true);
  const ownerWorkspace: WorkspaceItem[] = [],
    othersWorkspace: WorkspaceItem[] = [];
  for (var i = 0; i < workspace.workspaceList.length; i++) {
    var el = workspace.workspaceList[i];
    if (el.owner_id === user.id) {
      ownerWorkspace.push(el);
    } else {
      othersWorkspace.push(el);
    }
  }
  const hasOwner = ownerWorkspace.length > 0;
  const hasOthers = othersWorkspace.length > 0;
  const showDivider = hasOwner && hasOthers;
  async function GetUserWorkspace() {
    setLoading(true);
    const res = await getWorkspaceListRequest();
    if (res.code == responseCode.SUCCESS) {
      store.dispatch(UpdateWorkspaceList({ workspaces: res.data.workspaces }));
    }
    setLoading(false);
  }
  useEffect(() => {
    GetUserWorkspace();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        className="w-11/12 lg:w-[28rem]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {loading ? (
          <ChaseLoading text={t`Loading Workspace...`}></ChaseLoading>
        ) : (
          <>
            {(hasOwner || hasOthers) && (
              <>
                <div className="mb-6 flex flex-col items-center gap-2">
                  <p className="text-2xl font-bold text-center">
                    {t`Select your workspace`}
                  </p>
                  <p className="text-sm text-center text-gray-500">
                    {t`Select a workspace to start using Mameos`}
                  </p>
                </div>
                <Card>
                  <CardBody>
                    <div>
                      {hasOwner && (
                        <WorkspaceSelctList workspaceList={ownerWorkspace} />
                      )}
                      {showDivider && <Divider />}
                      {hasOthers && (
                        <WorkspaceSelctList workspaceList={othersWorkspace} />
                      )}
                    </div>
                  </CardBody>
                </Card>
              </>
            )}
            {!(hasOwner || hasOthers) && <WorkspaceInitStep />}
          </>
        )}
      </motion.div>
    </div>
  );
}
