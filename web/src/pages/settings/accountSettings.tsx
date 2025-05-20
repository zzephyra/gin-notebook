import ModifyPasswordModal from "@/components/modal/user/modifyPassword";
import SettingsItem from "@/components/setting/item";
import SettingsWrapper from "@/components/setting/wrapper";
import { updateInfoRequest } from "@/features/api/user";
import { RootState } from "@/store";
import { Status, useUpload } from "@/thirdpart/qiniu/upload";
import { Avatar, Input, Tooltip, Spinner, Button, Modal, useDisclosure, ModalContent, ModalHeader, ModalBody, ModalFooter, Form } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useRef } from "react"
import toast from "react-hot-toast";
import { useSelector } from "react-redux";


const AccountSettings = () => {
    var userState = useSelector((s: RootState) => s.user)
    var { replaceFile, UploadSate, getFileLink } = useUpload()
    var { t } = useLingui()
    var fileInputRef = useRef<HTMLInputElement | null>(null);
    const { isOpen: isOpenPasswordModal, onOpen: opOpenPasswordModal, onOpenChange: onOpenChangePasswordModal } = useDisclosure();

    async function handleUpdateNickName(e: React.FocusEvent<HTMLInputElement>) {
        let isUpdated = await updateInfoRequest(userState.id, {
            nickname: e.target.value
        })
        if (isUpdated) {
            toast.success(t`Update nickname successfully`)
        }
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        replaceFile(file, () => {
            var fileUrl = getFileLink()
            if (!fileUrl) {
                toast.success(t`Upload avatar failed`)
                return
            }
            updateInfoRequest(userState.id, {
                avatar: fileUrl
            }).then((isUpdated) => {
                if (isUpdated) {
                    toast.success(t`Update avatar successfully`)
                }
            })
        });
    };

    function handleAvatarClick() {
        fileInputRef.current?.click();
    }

    return (
        <>
            <SettingsWrapper title="Account Settings">
                <SettingsItem custom className="gap-4">
                    <div className="relative group">
                        <Tooltip content={t`Upload Avatar`} color="foreground" placement='bottom' showArrow={true}>
                            <div>
                                <Avatar onClick={handleAvatarClick} src={userState.avatar} name={userState.nickname || userState.email} className="cursor-pointer w-16 h-16 text-large hover:bg-zinc-400">
                                </Avatar>
                                {
                                    UploadSate == Status.Processing && (
                                        <>
                                            <div className="text-white flex justify-center items-center absolute top-0 left-0 w-full h-full bg-black opacity-50 rounded-full">
                                                <Spinner classNames={{ label: "mt-4" }} color="default" variant="dots" />
                                            </div>
                                        </>
                                    )
                                }
                            </div>
                        </Tooltip>
                        <Input ref={fileInputRef} onChange={handleFileChange} accept="image/*" size="sm" type="file" className="hidden">
                            {t`Upload`}
                        </Input>
                    </div>
                    <div>
                        <Input className="w-[15rem]" onBlur={handleUpdateNickName} defaultValue={userState.nickname} size="sm" labelPlacement="outside" label="Nickname" placeholder={t`Come up with a good name!`}></Input>
                    </div>
                </SettingsItem>
                <SettingsItem label={t`Password`} description={t`Change your password`}>
                    <Button size="sm" color="default" onPress={opOpenPasswordModal}>
                        {t`Change Password`}
                    </Button>
                </SettingsItem>
            </SettingsWrapper>
            <ModifyPasswordModal userID={userState.id} isOpen={isOpenPasswordModal} onChange={onOpenChangePasswordModal} />
        </>
    );
}
export default AccountSettings;