import { Note } from "@/pages/workspace/type";

export interface NoteProps {
    note: Note
    isCollapsed: boolean
    setCollapsed: (value: boolean) => void
}