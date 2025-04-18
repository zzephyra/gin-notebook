import { RootState, store } from "@/store";
import { Listbox, ListboxItem } from "@heroui/react";
import { useSelector } from "react-redux";
import CategoryListItem from "../categoryItem";
import { CategoryItem, UpdateNoteByID } from "@/store/features/workspace";
import { Note } from "@/pages/workspace/type";
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { UpdateNote } from "@/features/api/note";


export default function CategoryListBox({ category, onSelect, onDropNoteToCategory }: {
    category: CategoryItem, onSelect: (note: Note) => void, onDropNoteToCategory?: (noteId: number, targetCategoryId: number, originalCategoryId: number) => void;
}) {
    const notes = useSelector((state: RootState) => state.workspace.noteList.filter(n => n.category_id === category.id));
    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, noteId: number) => {
        e.dataTransfer.setData("noteId", noteId.toString());
        e.dataTransfer.setData("original_categoryId", category.id.toString());
    };
    return (
        <Listbox>
            {notes.map((note) =>
                <ListboxItem startContent={<DocumentTextIcon className="size-5" />} draggable key={note.id} onPress={() => onSelect(note)} onDragStart={(e) => handleDragStart(e, note.id)}>
                    <CategoryListItem note={note} />
                </ListboxItem>
            )}
        </Listbox>
    )
}