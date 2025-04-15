import { WorkspaceItem } from "@/store/features/workspace";
import { Avatar, Button, Listbox, ListboxItem } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useNavigate } from "react-router-dom";

interface WorkspaceSelctListProps {
  workspaceList: WorkspaceItem[];
}

export default function WorkspaceSelctList(props: WorkspaceSelctListProps) {
  const { t } = useLingui();
  const navigate = useNavigate();
  function handleSelectWorkspace(workspaceID: number) {
    navigate(`/workspace/${workspaceID}`);
  }

  return (
    <Listbox className="overflow-y-auto h-52">
      {props.workspaceList.map((item) => (
        <ListboxItem key={item.id} className="group">
          <div className="flex ">
            <Avatar src={item.owner_avatar}></Avatar>
            <div className="flex-1 flex justify-between items-center">
              <div className="pl-4 flex flex-col">
                <div>{item.name}</div>
                <div className="text-xs text-slate-400">
                  {t`Created by:`} {item.owner_name || item.owner_email}
                </div>
              </div>
              <Button
                size="sm"
                onPress={() => handleSelectWorkspace(item.id)}
                className="group-hover:bg-white group-hover:block hidden group-focus:bg-white group-focus:block"
              >{t`Select`}</Button>
            </div>
          </div>
        </ListboxItem>
      ))}
    </Listbox>
  );
}
