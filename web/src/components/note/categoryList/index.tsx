import { RootState, store } from "@/store";
import { Listbox, ListboxItem } from "@heroui/react";
import { useSelector } from "react-redux";
import CategoryListItem from "../categoryItem";
import { CategoryItem, UpdateNoteByID } from "@/store/features/workspace";
import { Note } from "@/pages/workspace/type";
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Draggable } from "@/components/plate-ui/draggable";


export default function CategoryListBox({ category, onSelect, onDropNoteToCategory }: {
    category: CategoryItem, onSelect: (note: Note) => void, onDropNoteToCategory?: (noteId: string, targetCategoryId: string, originalCategoryId: string) => void;
}) {
    const notes = useSelector(
        (state: RootState) => state.workspace.noteList.entities  // adapter 字典
    );

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, noteId: string) => {
        console.log("handleDragStart", noteId);
        e.dataTransfer.setData("noteId", noteId);
        e.dataTransfer.setData("original_categoryId", category.id.toString());
    };

    const filteredNotes = Object.values(notes).filter(
        (note) => note && note.category_id === category.id // 🔍 筛选出这个分类的 notes
    );
    return (
        <Listbox>
            {filteredNotes.map((note) => {
                return (
                    <ListboxItem startContent={<DocumentTextIcon className="size-5" />} draggable key={note.id} onPress={() => onSelect(note)} onDragStart={(e) => handleDragStart(e, note.id)}>
                        <CategoryListItem note={note} />
                    </ListboxItem>
                )
            }
            )}
        </Listbox>
    )
}