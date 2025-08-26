import { UserIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { forwardRef, useMemo } from "react";
import { MemberDropdownProps } from "./type";
import { Avatar, AvatarGroup } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import ChaseLoading from '@/components/loading/Chase/loading';
import { WorkspaceMember } from "@/types/workspace";

const MemberDropdown = forwardRef<HTMLDivElement, MemberDropdownProps>((props, _) => {
    const { t } = useLingui();

    const handleSelectAssignee = (key: any) => {
        props.onAction?.(key);
    }
    const selectUsers = useMemo(() => {
        return Array.from(props.selectedKeys || []).map((id) => {
            return props.members.find((member) => member && member.id === id);
        }).filter((member) => member !== undefined) as WorkspaceMember[];
    }, [props.selectedKeys, props.members]);
    const handleSearchValueChange = (value: string) => {
        props.onKeywordChange?.(value);
    }

    return (
        <Dropdown closeOnSelect={false} backdrop="opaque">
            <DropdownTrigger>
                <Button size='sm' variant='light' className='w-full justify-start gap-1'>
                    <UserIcon className='w-4 h-4 text-gray-400' />

                    {
                        selectUsers.length > 0 ? (
                            <>
                                <AvatarGroup className='ml-2' size="sm">
                                    {
                                        selectUsers.map((assignee) => (
                                            <Avatar key={assignee.id} src={assignee.avatar} alt={assignee.avatar}>
                                            </Avatar>
                                        ))
                                    }
                                </AvatarGroup>
                            </>
                        ) : (
                            <>
                                <span className='text-xs text-gray-500 truncate'>
                                    {t`Select Assignee`}
                                </span>
                            </>
                        )
                    }
                </Button>
            </DropdownTrigger>
            <DropdownMenu onAction={handleSelectAssignee} selectionMode="multiple" selectedKeys={props.selectedKeys} ref={props.menuRef}>
                <DropdownSection classNames={{ divider: "mt-0" }} showDivider aria-label="remote search members">
                    <DropdownItem key="search member" isReadOnly className='!bg-transparent !px-0'>
                        <Input size='sm' isDisabled={props.isFetching} onValueChange={handleSearchValueChange} placeholder={t`Look up a person...`} ></Input>
                    </DropdownItem>
                </DropdownSection>
                <DropdownSection>
                    {
                        props.isFetching ? (
                            <>
                                <DropdownItem key="loading" isReadOnly className='!bg-transparent cursor-default !px-0'>
                                    <ChaseLoading size="24px" text={t`Loading members...`} textClassName='text-xs' />
                                </DropdownItem>
                            </>
                        ) : (props.members.map((member) => (
                            <DropdownItem key={member.id}>
                                <div className='flex gap-1 items-center'>
                                    <Avatar src={member.avatar} alt={member.avatar} className="w-6 h-6 text-tiny">
                                    </Avatar>
                                    <span className='text-xs ml-1 text-gray-500'>
                                        {member.workspace_nickname || member.user_nickname || member.email}
                                    </span>
                                    {
                                        member.workspace_nickname && (
                                            <>
                                                <span className='text-xs text-gray-500'>
                                                    ({member.user_nickname || member.email})
                                                </span>
                                            </>
                                        )
                                    }
                                </div>
                            </DropdownItem>
                        )))
                    }
                </DropdownSection>
            </DropdownMenu>
        </Dropdown>
    )

})

export default MemberDropdown;