// components/PolicyRow.tsx
import { Badge, Tag } from "@douyinfe/semi-ui";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";
import { PlayIcon, StopIcon, EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useLingui } from "@lingui/react/macro";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import useIntegration from "@/hooks/useIntegration";
import { SyncPolicy } from "@/types/sync";
import { useState } from "react";

export function NotePolicyCard({
    policy,
    onDelete,
}: {
    policy: SyncPolicy;
    onDelete?: (syncID: string) => Promise<void>;
}) {
    const { i18n, t } = useLingui();
    const rel = useRelativeTime(policy.updated_at, i18n); // ✅ 子组件内部用 Hook 安全
    const { thirdPartyIntegrationsMapping } = useIntegration()
    const { isOpen: isOpenDeleteConfirm, onOpen: onOpenDeleteConfirm, onClose: onCloseDeleteConfirm } = useDisclosure();
    const [deleteLoading, setDeleteLoading] = useState(false);
    const handleDelete = async () => {
        setDeleteLoading(true);

        onDelete && await onDelete(policy.id);
        setDeleteLoading(false);
    }

    return (
        <div className="border border-slate-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {thirdPartyIntegrationsMapping[policy.provider]?.icon}
                    <div className="ml-2">
                        <div className="text-sm font-medium text-gray-700">
                            {i18n._(thirdPartyIntegrationsMapping[policy.provider]?.name)}
                        </div>
                        <div className="text-xs mt-0.5 text-gray-500 select-none">ID: {policy.id}</div>
                    </div>
                </div>
                <div>
                    <Button isIconOnly className="w-7 h-7 min-w-0" variant="light" radius="full">
                        {!policy.is_active ? (
                            <PlayIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                            <StopIcon className="w-4 h-4 text-gray-400" />
                        )}
                    </Button>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly className="w-7 h-7 min-w-0 ml-1" variant="light" radius="full">
                                <EllipsisHorizontalIcon className="w-4 h-4 text-gray-400" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            <DropdownItem key={"delete"} color="danger" onPress={onOpenDeleteConfirm} startContent={<TrashIcon className="w-4 h-4" />}>
                                {t`Remove`}
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>

            <Modal isOpen={isOpenDeleteConfirm} onOpenChange={onCloseDeleteConfirm} >
                <ModalContent className="bg-red-50 dark:bg-[#191919]">
                    <ModalHeader className="light:text-red-700">
                        {t`Confirm Deletion`}
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex items-start gap-3">
                            {/* <ExclamationTriangleIcon className="w-6 h-6  flex-shrink-0" /> */}
                            <div className="space-y-1">
                                <p className="font-semibold light:text-red-700">
                                    {t`Are you sure you want to delete this synchronization policy?`}
                                </p>
                                <p className="text-sm light:text-red-800">
                                    {t`This action cannot be undone.`}
                                </p>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter className="pt-0">
                        <div className="flex justify-end p-4">
                            <Button className="mr-2" disabled={deleteLoading} variant="light" size="sm" onPress={onCloseDeleteConfirm} >{i18n._(t`Cancel`)}</Button>
                            <Button color="danger" isLoading={deleteLoading} size="sm" onPress={handleDelete}>{i18n._(t`Delete`)}</Button>
                        </div>
                    </ModalFooter>
                </ModalContent>

            </Modal>

            <div className="flex mt-2 justify-between items-center">
                <div>
                    <Tag shape="circle" color="amber" size="small">
                        {i18n._(policy.mode === "auto" ? t`Auto Sync` : t`Manual Sync`)}
                    </Tag>
                    {policy.updated_at && (
                        <span className="text-xs text-gray-500 ml-2 select-none">{t`Last Run`}: {rel}</span>
                    )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                    <Badge dot type={policy.is_active ? "secondary" : "danger"} />{" "}
                    {policy.is_active ? i18n._(t`Active`) : i18n._(t`Inactive`)}
                </div>
            </div>
        </div>
    );
}
