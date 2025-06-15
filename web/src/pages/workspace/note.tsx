import ChaseLoading from "@/components/loading/Chase/loading";
import { GetNoteCategory, GetNoteList } from "@/features/api/note";
import {
  Divider, Input,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLingui } from "@lingui/react/macro";
import SearchIcon from "@/components/icons/search";
import NotePage from "@/components/note/main";
import { useSelector } from "react-redux";
import { RootState, store } from "@/store";
import { UpdateNoteCategoryList } from "@/store/features/workspace";
import NoteDropdown from "@/components/dropdown/note";
import { notesSelectors } from "@/store/selectors";
import AIChat from "@/components/aiChat";
import { useMediaQuery } from 'react-responsive';
import NotesList from "@/components/list/notes";

export default function WorkspaceMain() {
  const [collapsed, setCollapsed] = useState(false);
  var params = useParams();
  const { t } = useLingui();
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  const [loading, setLoading] = useState(true);
  // 当前所选的笔记id
  const selectedId = useSelector(
    (state: RootState) => state.workspace.selectedNoteId
  );
  // 当前笔记
  const note = useSelector(
    (state: RootState) => notesSelectors.selectById(state, selectedId || "")  // adapter 字典
  );

  useEffect(() => {
    Promise.all([GetNoteCategory(params.id, ''), GetNoteList(params.id, 0, 50)]).then((res) => {
      setLoading(false);
      store.dispatch(UpdateNoteCategoryList(res[0]))

    })
  }, [])


  if (loading) {
    return <ChaseLoading text={t`Loading notes...`} />;
  }

  return (
    <>
      <div className="flex h-full flex-1">
        {
          isDesktop && (
            <div
              className={`${collapsed ? '' : 'px-2 pt-4 '}relative `}
            >
              <div className={`transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-80"}`}>
                <div className="flex items-center justify-between mb-2 gap-4">
                  <Input size="sm" startContent={<SearchIcon filled={true} className="fill-gray-400" />} placeholder="Search Notes">
                  </Input>
                  <NoteDropdown></NoteDropdown>
                </div>
                <Divider className="my-4"></Divider>
                <NotesList />
              </div>
            </div>
          )
        }

        {!collapsed && <Divider orientation="vertical"></Divider>}
        <div className="flex-1 flex flex-col w-0 ">
          {selectedId != null ? <NotePage note={note} isCollapsed={collapsed} setCollapsed={setCollapsed} /> :
            <AIChat isCollapsed={collapsed} setCollapsed={setCollapsed}></AIChat>}
        </div>
      </div>
    </>
  );
}
