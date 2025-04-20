import ChaseLoading from "@/components/loading/Chase/loading";
import { GetNoteCategory, GetNoteList, UpdateCategory, UpdateNote } from "@/features/api/note";
import {
  Button,
  Divider, Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalHeader,
  Checkbox,
  useDisclosure
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useLingui } from "@lingui/react/macro";
import { Note, NoteCategory } from "./type"
import { Accordion, AccordionItem } from "@heroui/accordion";
import PlusIcon from "@/components/icons/plus";
import SearchIcon from "@/components/icons/search";
import NotePage from "@/components/note/main";
import { useSelector } from "react-redux";
import { RootState, store } from "@/store";
import CategoryListBox from "@/components/note/categoryList";
import FolderIcon from "@/components/icons/folder";
import { responseCode } from "@/features/constant/response";
import { UpdateCategoryByID, UpdateNoteByID } from "@/store/features/workspace";
import { i18n } from "@lingui/core";
import { DocumentIcon, DocumentTextIcon, FolderPlusIcon } from "@heroicons/react/24/outline";
import NoteDropdown from "@/components/dropdown/note";
import toast from "react-hot-toast";


function CategoryTitleProps({ title, workspaceID, categoryID }: { title: string, workspaceID: number, categoryID: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsEditing(!isEditing)
  }

  useEffect(() => {
    if (isEditing) {
      // 等下一帧 DOM 更新完毕再 focus
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isEditing]);

  async function handleChangeCategoryName() {
    let newCategoryName = inputRef.current?.value;
    setIsEditing(false);
    let res = await UpdateCategory(workspaceID, categoryID, { category_name: newCategoryName })
    if (res.code == responseCode.SUCCESS) {
      store.dispatch(UpdateCategoryByID({ id: categoryID, data: { category_name: newCategoryName } }))
    }
  }


  return (
    <div onDoubleClick={handleDoubleClick} className="h-6">
      {isEditing ? (
        <Input ref={inputRef} defaultValue={title} onBlur={handleChangeCategoryName} classNames={{inputWrapper: "h-6 min-h-0"}}>
          {title}
        </Input>
      ) : (
        <span className="flex items-center gap-1 h-full">
          {title}
        </span>
      )}
    </div>
  )
}

export default function WorkspaceMain() {
  const [collapsed, setCollapsed] = useState(false);
  var params = useParams();
  const { t } = useLingui();
  const [loading, setLoading] = useState(true);
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const { isOpen: isOpenIgnorePrompt, onOpen: onOpenPrompt, onOpenChange: onOpenPromptChange } = useDisclosure();
  const [promptText, setPromptTextName] = useState<string>("123");
  const noteTransferRef = useRef({ noteID: 0, originalCategoryId: 0, targetCategoryId: 0 });
  useEffect(() => {
    Promise.all([GetNoteCategory(params.id), GetNoteList(params.id, 0, 50)]).then((res) => {
      setLoading(false);
    })
  }, [])
  const categoryList = useSelector((state: RootState) => state.workspace.categoryList);

  if (loading) {
    return <ChaseLoading text={t`Loading notes...`} />;
  }

  async function onDropNoteToCategory(noteId: number, targetCategoryId: number, originalCategoryId: number) {
    // 在这里处理 drop 事件，例如更新状态或发送请求
    if (params.id) {
      const res = await UpdateNote(Number(params.id), noteId, { category_id: targetCategoryId });
      if (res.code != responseCode.SUCCESS) {
        toast.error(t`Move note failed`);
        store.dispatch(UpdateNoteByID({ id: noteId, data: { category_id: originalCategoryId } }));
      }
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLElement>, categoryId: number, categoryName: string) => {
    e.preventDefault();
    let ignorePrompt = sessionStorage.getItem("ignorePrompt") == "true";
    const noteIdStr = e.dataTransfer.getData("noteId");
    const originalCategoryIdStr = e.dataTransfer.getData("original_categoryId");
    if (noteIdStr && originalCategoryIdStr) {
      const noteId = parseInt(noteIdStr, 10);
      const originalCategoryId = parseInt(originalCategoryIdStr, 10);
      if (noteId === 0 || originalCategoryId === 0 || categoryId === 0 || originalCategoryId == categoryId) {
        return;
      }
      noteTransferRef.current = { noteID: noteId, originalCategoryId: originalCategoryId, targetCategoryId: categoryId };
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

    store.dispatch(UpdateNoteByID({ id: noteID, data: { category_id: targetCategoryId } }));
    if (onDropNoteToCategory) {
      onDropNoteToCategory(noteID, targetCategoryId, originalCategoryId);
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); // 必须阻止默认行为，否则 drop 事件不会触发
  };

  return (
    <>
      <div className="flex h-full flex-1">
        <div
          className={`px-2 pt-4 relative `}
        >
          <div className={`transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-80"}`}>
            <div className="flex items-center justify-between mb-2 gap-4">
              <Input size="sm" startContent={<SearchIcon filled={true} className="fill-gray-400" />} placeholder="Search Notes">
              </Input>
              <NoteDropdown></NoteDropdown>
            </div>
            <Divider className="my-4"></Divider>
            <Accordion variant="splitted" isCompact selectionMode="multiple">
              {categoryList.map((category: NoteCategory) => (
                <AccordionItem onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, category.id, category.category_name)} className="flex-shrink-0 text-xl" key={category.id} aria-label={category.category_name} startContent={<FolderIcon />} title={<CategoryTitleProps workspaceID={Number(params.id)} categoryID={category.id} title={category.category_name} />}>
                  <CategoryListBox key={category.id} category={category} onSelect={setCurrentNote} onDropNoteToCategory={onDropNoteToCategory} />
                </AccordionItem>
              ))}
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
                    </ModalFooter></>
                )}
              </ModalContent>
            </Modal>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 
                     w-6 h-20 bg-white text-black shadow-md rounded-full 
                     flex items-center justify-center z-10"
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>
        {!collapsed && <Divider orientation="vertical"></Divider>}
        <div className="flex-1 flex flex-col w-0 ">
          {currentNote != null ? <NotePage note={currentNote} /> : <div ></div>}
        </div>
      </div>
    </>
  );
}
