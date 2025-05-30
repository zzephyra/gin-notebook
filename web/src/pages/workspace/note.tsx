import ChaseLoading from "@/components/loading/Chase/loading";
import { GetNoteCategory, GetNoteList, UpdateNote } from "@/features/api/note";
import {
  Button,
  Divider, Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalHeader,
  Checkbox,
  useDisclosure,
  Accordion, AccordionItem
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useLingui } from "@lingui/react/macro";
import { Note, NoteCategory } from "./type"
import SearchIcon from "@/components/icons/search";
import NotePage from "@/components/note/main";
import { useSelector } from "react-redux";
import { RootState, store } from "@/store";
import CategoryListBox from "@/components/note/categoryList";
import FolderIcon from "@/components/icons/folder";
import { responseCode } from "@/features/constant/response";
import { setSelectedNoteId, UpdateNoteByID, UpdateNoteCategoryList } from "@/store/features/workspace";
import { i18n } from "@lingui/core";
import NoteDropdown from "@/components/dropdown/note";
import toast from "react-hot-toast";
import { notesSelectors } from "@/store/selectors";
import React from "react";
import CategoryTitle from "@/components/category/title";



export default function WorkspaceMain() {
  const [collapsed, setCollapsed] = useState(false);
  var params = useParams();
  const { t } = useLingui();
  const [loading, setLoading] = useState(true);
  const { isOpen: isOpenIgnorePrompt, onOpen: _, onOpenChange: onOpenPromptChange } = useDisclosure();
  const [promptText, setPromptTextName] = useState<string>("123");
  const noteTransferRef = useRef({ noteID: "", originalCategoryId: "", targetCategoryId: "" });
  const categoryList = useSelector((state: RootState) => state.workspace.categoryList);
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


  async function onDropNoteToCategory(noteID: string, targetCategoryId: string, originalCategoryId: string) {
    // 在这里处理 drop 事件，例如更新状态或发送请求
    let transformedNote = notesSelectors.selectById(store.getState(), noteID);
    if (params.id && transformedNote) {
      console.log("onDropNoteToCategory", noteID, targetCategoryId, originalCategoryId);
      const res = await UpdateNote(params.id, noteID, { category_id: targetCategoryId });
      if (res.code != responseCode.SUCCESS) {
        toast.error(t`Move note failed`);
        store.dispatch(UpdateNoteByID({ ...transformedNote, category_id: originalCategoryId }));
      }
    }
  }



  const handleDrop = (e: React.DragEvent<HTMLElement>, categoryId: string, categoryName: string) => {
    e.preventDefault();
    let ignorePrompt = sessionStorage.getItem("ignorePrompt") == "true";
    const noteIdStr = e.dataTransfer.getData("noteId");
    const originalCategoryIdStr = e.dataTransfer.getData("original_categoryId");
    if (noteIdStr && originalCategoryIdStr) {
      const noteId = noteIdStr;
      if (noteIdStr === undefined || originalCategoryIdStr === undefined || originalCategoryIdStr == categoryId) {
        return;
      }
      noteTransferRef.current = { noteID: noteId, originalCategoryId: originalCategoryIdStr, targetCategoryId: categoryId };
    } else {
      return;
    }
    if (ignorePrompt) {
      SwitchCategory();
    } else {
      setPromptTextName(categoryName);
      onOpenPromptChange();
    }
  };

  function SwitchCategory() {
    // 在这里处理 drop 事件，例如更新状态或发送请求
    let { noteID, originalCategoryId, targetCategoryId } = noteTransferRef.current;
    let transformedNote = notesSelectors.selectById(store.getState(), noteID);
    store.dispatch(UpdateNoteByID({ ...transformedNote, category_id: targetCategoryId }));
    if (onDropNoteToCategory) {
      onDropNoteToCategory(noteID, targetCategoryId, originalCategoryId);
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); // 必须阻止默认行为，否则 drop 事件不会触发
  };

  const setCurrentNote = (note: Note) => {
    store.dispatch(setSelectedNoteId(note.id));
  }

  return (
    <>
      <div className="flex h-full flex-1">
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
            <Accordion variant="splitted" isCompact selectionMode="multiple">
              {categoryList.map((category: NoteCategory) => {
                return (
                  <AccordionItem
                    key={category.id}
                    aria-label={category.category_name}
                    className="flex-shrink-0 text-xl"
                    startContent={<FolderIcon />}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, category.id, category.category_name)}
                    title={
                      <CategoryTitle
                        workspaceID={params.id || ""}
                        categoryID={category.id}
                        title={category.category_name}
                      />
                    }
                  >
                    <CategoryListBox
                      category={category}
                      onSelect={setCurrentNote}
                      onDropNoteToCategory={onDropNoteToCategory}
                    />
                  </AccordionItem>
                );
              })}

            </Accordion>
            <Modal isOpen={isOpenIgnorePrompt} onOpenChange={onOpenPromptChange}>
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalHeader>
                      <h2 className="text-lg font-bold">{t`File movement`}</h2>
                    </ModalHeader>
                    <ModalBody>
                      <span>
                        {i18n._('Would you like to move the file to the "{total}" folder?', { total: promptText })}
                      </span>
                      <Checkbox size="sm" onValueChange={(value) => sessionStorage.setItem("ignorePrompt", value ? "true" : "false")}>
                        {t`Ignore this prompt for this login`}
                      </Checkbox>
                    </ModalBody>
                    <ModalFooter>
                      <Button size="sm" color="danger" onPress={onClose}>
                        {t`Cancel`}
                      </Button>
                      <Button size="sm" color="primary" onPress={() => { SwitchCategory(); onClose(); }}>
                        {t`Move`}
                      </Button>
                    </ModalFooter>
                  </>
                )}
              </ModalContent>
            </Modal>
          </div>
        </div>
        {!collapsed && <Divider orientation="vertical"></Divider>}
        <div className="flex-1 flex flex-col w-0 ">
          {selectedId != null ? <NotePage note={note} isCollapsed={collapsed} setCollapsed={setCollapsed} /> : <div ></div>}
        </div>
      </div>
    </>
  );
}
