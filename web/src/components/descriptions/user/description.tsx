import { Avatar } from "@heroui/react";

interface UserDescriptionProps {
    email: string;
    nickname: string;
    phone: string;
    roles: string[];
    avatar: string;
}

export default function UserDescription(user: UserDescriptionProps) {
    return (
        <div>
            <div>
                <Avatar src={user.avatar} name={user.nickname || user.email}></Avatar>
            </div>
            <div>
                <p>

                </p>
            </div>
        </div>
    )
}