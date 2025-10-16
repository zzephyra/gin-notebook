import { Block } from "@blocknote/core";

export type TemplateNote = {
    id: string;
    content: Block[];
    cover?: string;
    title: string;
    user_id: string;
    created_at?: string;
    updated_at?: string;
}