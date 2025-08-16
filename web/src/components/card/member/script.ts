import { TagColor } from "@douyinfe/semi-ui/lib/es/tag";

const RoleColorMap: Record<string, TagColor> = {
    admin: 'red',
    member: 'light-green',
};

export function getRoleColor(role: string): TagColor {
    return RoleColorMap[role] || 'bg-gray-500';
}