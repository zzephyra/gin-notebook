import SettingsItem from "@/components/setting/item";
import SettingsWrapper from "@/components/setting/wrapper";
import { getWorkspaceInviteLinksListRequest, updateWorkspaceRequest, deleteWorkspaceInviteLinkRequest } from "@/features/api/workspace";
import { RootState, store } from "@/store";
import { UpdateCurrentWorkspace, WorkspaceItem } from "@/store/features/workspace";
import { generateInviteUrl } from "@/utils/tools";
import { QrCodeIcon, QuestionMarkCircleIcon, TrashIcon } from "@heroicons/react/24/solid";
import { TableColumn, TableHeader, ModalFooter, Table, Switch, Snippet, useDisclosure, TableBody, TableRow, TableCell, Tooltip, Chip, Modal, ModalContent, ModalHeader, ModalBody, Button } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { QRCodeCanvas } from 'qrcode.react';
import { useSelector } from "react-redux";
import AddWorkspaceLinkModal, { CreateLinkResponse } from "@/components/modal/workspace/link";
const WorkspaceSettings = () => {
    const workspaceState = useSelector((s: RootState) => s.workspace)
    const [inviteUrlList, setInviteUrlList] = useState<any[]>([])
    const { t } = useLingui()
    const [inviteQrcodeUrl, setInviteQrcodeUrl] = useState<string>("")
    const { isOpen: isOpenQrcodeModal, onOpen: onOpenQrcodeModal, onOpenChange: onOpenChangeQrcodeModal } = useDisclosure();
    const { isOpen: isOpenDeleteLinkModal, onOpen: onOpenDeleteLinkModal, onOpenChange: onOpenChangeDeleteLinkModal } = useDisclosure();
    const { isOpen: isOpenAddLinkModal, onOpen: _, onOpenChange: onOpenChangeAddLinkModal } = useDisclosure();

    const [deleteLinkId, setDeleteLinkId] = useState<string>("")
    const handleUpdate = async (value: Partial<WorkspaceItem>, successMsg?: string) => {
        if (!workspaceState.currentWorkspace?.id) {
            return
        }
        const res = await updateWorkspaceRequest(workspaceState.currentWorkspace.id, value)
        if (res) {
            if (successMsg) {
                toast.success(successMsg)
            }
            store.dispatch(UpdateCurrentWorkspace({ ...workspaceState.currentWorkspace, ...value }))
        }
    }

    useEffect(() => {
        if (workspaceState.currentWorkspace?.id == undefined || !workspaceState.currentWorkspace?.allow_invite) {
            return
        }
        getWorkspaceInviteLinksListRequest(workspaceState.currentWorkspace?.id).then((data) => {
            setInviteUrlList(data || [])
        })
    }, [workspaceState.currentWorkspace?.allow_invite])

    const handleOpenQrcodeModal = (data: any) => {
        if (data.is_expired) {
            toast.error(t`This link is expired`)
            return
        }
        setInviteQrcodeUrl(`${window.location.origin}/invite/${data.uuid}`)
        onOpenQrcodeModal()
    }

    const handleDeleteInviteLink = async (id: string) => {
        if (workspaceState.currentWorkspace?.id == undefined || id == undefined || id == "") {
            return
        }

        let res = await deleteWorkspaceInviteLinkRequest(workspaceState.currentWorkspace?.id, id)
        if (res) {
            toast.success(t`Delete successfully`)
            setInviteUrlList(inviteUrlList.filter((item) => item.id != id))
        } else {
            toast.error(t`Delete failed`)
        }
        onOpenChangeDeleteLinkModal()
    }


    const handleOpenDeleteLinkModal = (id: string) => {
        if (inviteUrlList.find((item) => item.id == id)) {
            setDeleteLinkId(id)
            onOpenDeleteLinkModal()
        }
    }

    const RenderCell = (columnKey: React.Key, data: any) => {
        switch (columnKey) {
            case "status":
                return data?.is_expired ? <Chip size="sm" color="danger">{t`Expired`}</Chip> : <Chip size="sm" color="success" className="text-white">{t`Active`}</Chip>
            case "count":
                return <div className="flex items-center gap-2">
                    {data.count}
                </div>
            case "uuid":
                return <div>
                    <Snippet hideSymbol size="sm" onCopy={() => {
                        navigator.clipboard.writeText(generateInviteUrl(data.uuid))
                        toast.success(t`Copy successfully`)
                    }}>{data.uuid}</Snippet>
                </div>
            default:
                return <div className="flex items-center gap-4">
                    <QrCodeIcon className="cursor-pointer" onClick={() => handleOpenQrcodeModal(data)}></QrCodeIcon>
                    <TrashIcon className="cursor-pointer" onClick={() => handleOpenDeleteLinkModal(data.id)}></TrashIcon>
                </div>
        }
    }

    function downloadQrcode() {
        const canvas = document.getElementById('link-qrcode') as HTMLCanvasElement;
        if (!canvas) return
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'qrcode.png';
        downloadLink.click();
    }

    function onSuccess(result: CreateLinkResponse) {
        setInviteUrlList([...inviteUrlList, result])
        toast.success(t`Invite link created successfully`);
    }

    return (
        <>
            <SettingsWrapper title="Invate link" >
                <SettingsItem label={t`Invite link`} description={t`Invite link to join the workspace`}>
                    <Switch
                        aria-label="Enable invite link"
                        defaultSelected={workspaceState.currentWorkspace?.allow_invite || false}
                        onValueChange={(isSelected) => {
                            handleUpdate({ "allow_invite": isSelected })
                        }}></Switch>
                </SettingsItem>
                {workspaceState.currentWorkspace?.allow_invite &&
                    <>
                        <div>
                            <div className="mb-4 flex justify-end">
                                <Button color="primary" size="sm" onPress={onOpenChangeAddLinkModal}>
                                    {t`Add new Invite Link`}
                                </Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableColumn key="uuid">{t`Key`}</TableColumn>
                                    <TableColumn key="status">{t`Status`}</TableColumn>
                                    <TableColumn key="count">
                                        <div className="flex items-center gap-1">
                                            {t`Invited Members`}
                                            <Tooltip content={t`The number of members who have joined the workspace using this link`} color="foreground" placement='top' showArrow={true}>
                                                <QuestionMarkCircleIcon className="w-4" />
                                            </Tooltip>
                                        </div>
                                    </TableColumn>
                                    <TableColumn key="action">{t`Action`}</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {inviteUrlList.map((link) =>
                                        <TableRow key={link.uuid}>
                                            {(columnKey) => <TableCell>{RenderCell(columnKey, link)}</TableCell>}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                }
            </SettingsWrapper>
            <Modal isOpen={isOpenQrcodeModal} onOpenChange={onOpenChangeQrcodeModal}>
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-center gap-2">
                            {t`QR Code`}
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col items-center gap-4 mb-4">
                            <QRCodeCanvas id="link-qrcode" value={inviteQrcodeUrl}></QRCodeCanvas>
                            <div>
                                <Button color="primary" size="sm" onPress={downloadQrcode}>
                                    {t`Download Qrcode`}
                                </Button>
                            </div>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <Modal isOpen={isOpenDeleteLinkModal} onOpenChange={onOpenChangeDeleteLinkModal}>
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-center gap-2">
                            {t`Delete Invite Link`}
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col items-center gap-4 mb-4">
                            {t`Are you sure you want to delete this invite link?`}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" onPress={onOpenChangeDeleteLinkModal}>{t`Cancel`}</Button>
                        <Button size="sm" color="danger" onPress={() => handleDeleteInviteLink(deleteLinkId)}>{t`Delete`}</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <AddWorkspaceLinkModal onSuccess={onSuccess} isOpen={isOpenAddLinkModal} onOpenChange={onOpenChangeAddLinkModal} />
        </>
    )
}

export default WorkspaceSettings