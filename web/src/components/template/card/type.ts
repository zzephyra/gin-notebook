import { TemplateNote } from "../type";

export interface TemplateCardProps {
    note?: TemplateNote;
    empty?: boolean; // 是否是空模板
    draggable?: boolean; // 是否可拖拽
    emptyRender?: () => JSX.Element; // 空模板的渲染函数
    onClick?: (note?: TemplateNote) => void; // 点击模板卡片时的回调
    onDelete?: (note?: TemplateNote) => void; // 删除模板卡片时的回调
}