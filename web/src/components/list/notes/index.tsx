import CategoryTitle from "@/components/category/title";
import FolderIcon from "@/components/icons/folder";
import CategoryListBox from "@/components/note/categoryList";
import { Note, NoteCategory } from "@/pages/workspace/type";
import { RootState, store } from "@/store";
import { setSelectedNoteId, UpdateNoteByID } from "@/store/features/workspace";
import {
    Button,
    Modal,
    ModalContent,
    ModalFooter,
    ModalBody,
    ModalHeader,
    Checkbox,
    useDisclosure,
    Accordion, AccordionItem
} from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { notesSelectors } from "@/store/selectors";
import { responseCode } from "@/features/constant/response";
import { UpdateNote } from "@/features/api/note";
import toast from "react-hot-toast";

const NotesList = () => {
    const { t, i18n } = useLingui();
    const params = useParams();
    const noteTransferRef = useRef({ noteID: "", originalCategoryId: "", targetCategoryId: "" });
    const [promptText, setPromptTextName] = useState<string>("");

    const categoryList = useSelector((state: RootState) => state.workspace.categoryList);
    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault(); // 必须阻止默认行为，否则 drop 事件不会触发
    };

    const setCurrentNote = (note: Note) => {
        store.dispatch(setSelectedNoteId(note.id));
    }
    const { isOpen: isOpenIgnorePrompt, onOpen: _, onOpenChange: onOpenPromptChange } = useDisclosure();


    async function onDropNoteToCategory(noteID: string, targetCategoryId: string, originalCategoryId: string) {
        // 在这里处理 drop 事件，例如更新状态或发送请求
        let transformedNote = notesSelectors.selectById(store.getState(), noteID);
        if (params.id && transformedNote) {
            const res = await UpdateNote(params.id, noteID, { category_id: targetCategoryId });
            if (res.code != responseCode.SUCCESS) {
                toast.error(t`Move note failed`);
                store.dispatch(UpdateNoteByID({ id: noteID, changes: { category_id: originalCategoryId } }));
            }
        }
    }

    function SwitchCategory() {
        // 在这里处理 drop 事件，例如更新状态或发送请求
        let { noteID, originalCategoryId, targetCategoryId } = noteTransferRef.current;
        store.dispatch(UpdateNoteByID({ id: noteID, changes: { category_id: targetCategoryId } }));
        if (onDropNoteToCategory) {
            onDropNoteToCategory(noteID, targetCategoryId, originalCategoryId);
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
    return (
        <>
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
        </>
    )
}

export default NotesList;