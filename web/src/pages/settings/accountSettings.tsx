import SettingsItem from "@/components/setting/item";
import SettingsWrapper from "@/components/setting/wrapper";
import { updateInfoRequest, uploadUserAvatarRequest } from "@/features/api/user";
import { store } from "@/store";
import { Avatar, Input, Tooltip } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useRef } from "react"

const AccountSettings = () => {
    var state = store.getState()
    var { t } = useLingui()
    var fileInputRef = useRef<HTMLInputElement | null>(null);

    function handleUpdateNickName(e: React.FocusEvent<HTMLInputElement>) {
        updateInfoRequest({
            nickname: e.target.value
        })
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await uploadUserAvatarRequest(file)
    };

    function handleAvatarClick() {
        fileInputRef.current?.click();
    }

    return (
        <>
            <SettingsWrapper title="Account Settings">
                <SettingsItem label="test" custom className="gap-4">
                    <div className="relative group">
                        <Tooltip content={t`Upload Avatar`} color="foreground" placement='bottom' showArrow={true}>
                            <Avatar onClick={handleAvatarClick} src={state.user.avatar} name={state.user.nickname || state.user.email} className="cursor-pointer w-16 h-16 text-large hover:bg-zinc-400">
                            </Avatar>
                        </Tooltip>
                        <Input ref={fileInputRef} onChange={handleFileChange} accept="image/*" size="sm" type="file" className="hidden">
                            {t`Upload`}
                        </Input>
                    </div>
                    <div>
                        <Input className="w-[15rem]" onBlur={handleUpdateNickName} defaultValue={state.user.nickname} size="sm" labelPlacement="outside" label="Nickname" placeholder={t`Come up with a good name!`}></Input>
                    </div>
                </SettingsItem>
            </SettingsWrapper>
        </>
    );
}
export default AccountSettings;