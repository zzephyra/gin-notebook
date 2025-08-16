import { Tag } from "@douyinfe/semi-ui";
import { Avatar, Card, CardBody } from "@heroui/react";
import { MemberCardProps } from "./type";
import { getRoleColor } from "./script";

function MemberCard(props: MemberCardProps) {
    return (
        <Card>
            <CardBody>
                <div className="flex items-center gap-2">
                    <Avatar size="sm" src={props.member.avatar}></Avatar>
                    <div className="flex-1 flex flex-col gap-1">
                        <div className="text-sm font-semibold">
                            {props.member.workspace_nickname || props.member.user_nickname || props.member.email}
                            <span className="ml-2 text-xs text-gray-500">
                                ({props.member.email})
                            </span>
                        </div>

                        <div className="text-xs text-gray-500">
                            {(props.member.role || []).map((role) => (
                                <>
                                    <Tag size="small" type='solid' color={getRoleColor(role)} shape='circle'>
                                        {role}
                                    </Tag>
                                </>
                            )
                            )}
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
export default MemberCard;