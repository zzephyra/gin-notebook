export interface TiptapProps {
    content: string;
    onChange: (content: string) => void;
    onSave?: (content: string) => void;
}