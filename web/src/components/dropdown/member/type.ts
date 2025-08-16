import { WorkspaceMember } from "@/types/workspace";
import { RefObject } from "react";

export type MemberDropdownProps = {
    isFetching?: boolean;
    members: WorkspaceMember[];
    selectedKeys?: string[];
    onKeywordChange?: (keyword: string) => void;
    onAction?: (key: string) => void;
    menuRef?: RefObject<HTMLDivElement>
}