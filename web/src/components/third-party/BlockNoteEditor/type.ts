export type BlockNotePlaceholder = {
    emptyDocument?: string;
    default?: string;
    heading?: string;
}

export type BlockNoteOptions = {
    editable?: boolean
    placeholder?: Partial<BlockNotePlaceholder>;
}