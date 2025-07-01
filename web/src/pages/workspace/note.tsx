import ChaseLoading from "@/components/loading/Chase/loading";
import { GetNoteCategory, GetNoteList } from "@/features/api/note";
import {
  Button,
  Divider, Input,
  useDisclosure,
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useLingui } from "@lingui/react/macro";
import SearchIcon from "@/components/icons/search";
import NotePage from "@/components/note/main";
import { useSelector } from "react-redux";
import { RootState, store } from "@/store";
import { UpdateNoteCategoryList } from "@/store/features/workspace";
import NoteDropdown from "@/components/dropdown/note";
import { notesSelectors } from "@/store/selectors";
import AIChat, { AIChatRef } from "@/components/aiChat";
import { useMediaQuery } from 'react-responsive';
import NotesList from "@/components/list/notes";
import AIHistoryChats from "@/components/aiHistoryChats";
import { AIMessage } from "@/features/api/type";
import { ClockIcon, FolderIcon, Square2StackIcon, ViewColumnsIcon } from "@heroicons/react/24/outline";
import AvatarMenu from "@/components/avatarMenu";
import FolderDrawer from "@/components/drower/folderDrower";

export default function WorkspaceMain() {
  const [collapsed, setCollapsed] = useState(false);
  var params = useParams();
  const { t } = useLingui();
  const chatRef = useRef<AIChatRef>(null);
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const { isOpen: isOpenHistoryChats, onOpen: onOpenHistoryChats, onClose: onCloseHistoryChats } = useDisclosure();
  const { isOpen: isOpenFolderDrawer, onOpen: onOpenFolderDrawer, onOpenChange: onOpenChangeFolderDrawer } = useDisclosure();

  const [loading, setLoading] = useState(true);
  // 当前所选的笔记id
  const selectedId = useSelector(
    (state: RootState) => state.workspace.selectedNoteId
  );
  // 当前笔记
  const note = useSelector(
    (state: RootState) => notesSelectors.selectById(state, selectedId || "")  // adapter 字典
  );



  const LoadHistoryMessage = (messages: AIMessage[], sessionID: string) => {
    chatRef.current?.setMessages(messages.map(
      (msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        status: msg.status || 'complete',
        createAt: new Date(msg.created_at).getTime() || Date.now(),
        parentId: msg.parent_id,
        // references: msg.references || [],
      })
    ))
    chatRef.current?.updateSessionID(sessionID);
  }

  const handleCloseCollapse = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed);
    }
  }

  const emptyMessages = () => {
    chatRef.current?.newSession();
  }


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
          {selectedId != null ?
            <NotePage note={note} isCollapsed={collapsed} setCollapsed={setCollapsed} /> :
            (
              <>
                <div className='p-2 '>
                  <div className='flex items-center justify-between'>
                    <div className='flex'>
                      {
                        isDesktop ?
                          (
                            <Button isIconOnly radius='full' size='sm' variant="light" onPress={handleCloseCollapse} >
                              <ViewColumnsIcon className='w-5' />
                            </Button>
                          ) : (
                            <AvatarMenu>
                            </AvatarMenu>
                          )
                      }
                    </div>
                    <div className='flex'>
                      <Button className='group gap-px px-2 min-w-0' radius='full' size='sm' variant="light" onPress={emptyMessages}>
                        <Square2StackIcon className='w-5' />
                        <span className='max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[300px] transition-all text-xs text-gray-500'>{t`New Chat`}</span>
                      </Button>
                      <Button className='group gap-px px-2 min-w-0' radius='full' size='sm' variant="light" onPress={onOpenHistoryChats}>
                        <ClockIcon className='w-5' />
                        <span className='max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[300px] transition-all text-xs text-gray-500'>{t`History`}</span>
                      </Button>
                      {
                        isDesktop ? (<></>) : (
                          <>
                            <Button className='group gap-px px-2 min-w-0' radius='full' size='sm' variant="light" onPress={onOpenFolderDrawer}>
                              <FolderIcon className='w-5' />
                              <span className='max-w-0 opacity-0 group-hover:opacity-100 group-hover:max-w-[300px] transition-all text-xs text-gray-500'>{t`Notes`}</span>
                            </Button>
                            <FolderDrawer isOpen={isOpenFolderDrawer} onOpenChange={onOpenChangeFolderDrawer}>
                            </FolderDrawer>
                          </>
                        )
                      }
                    </div>
                  </div>
                </div>
                <AIHistoryChats onSelect={LoadHistoryMessage} isOpen={isOpenHistoryChats} onClose={onCloseHistoryChats} />
                <AIChat ref={chatRef} isCollapsed={collapsed} setCollapsed={setCollapsed}></AIChat>
              </>
            )}
        </div>
      </div>
    </>
  );
}
