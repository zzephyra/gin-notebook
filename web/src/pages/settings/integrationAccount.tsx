import FeishuIcon from "@/components/icons/feishu"
import SettingsItem from "@/components/setting/item"
import SettingsWrapper from "@/components/setting/wrapper"
import { useIntegration } from "@/contexts/IntegrationContext"
import { responseCode } from "@/features/constant/response"
import { SupportedIntegrationProvider } from "@/types/integration"
import { openFeishuAuthPopup } from "@/utils/feishuAuth"
import { ExclamationTriangleIcon, LinkIcon, LinkSlashIcon } from "@heroicons/react/24/outline"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import { Button, Link, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@heroui/react"
import { useLingui } from "@lingui/react/macro"
import { useState } from "react"
import toast from "react-hot-toast"


function IntegrationAccount() {
    const { appsMap, refreshIntegrationAccounts, unlinkIntegrationAccount } = useIntegration();
    const { t, i18n } = useLingui();
    const [deletingProvider, setDeletingProvider] = useState<{ title: string, provider: SupportedIntegrationProvider } | null>(null);
    async function onBindFeishu() {
        var feishu = appsMap["feishu"] // TODO: 选择不同的 app id
        if (!feishu || !feishu.is_active) {
            toast.error("飞书应用未配置或未激活");
            return; // 已存在但未激活，暂不允许重新绑定
        }
        const { ok, error } = await openFeishuAuthPopup(feishu.app_id, "feishu");
        if (ok) {
            refreshIntegrationAccounts("feishu");
            toast.success(t`Successfully linked`);
        } else {
            toast.success(t`Failed to link: ${error}`);
        }
    }
    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onOpenChange: onOpenChangeDeleteModal } = useDisclosure();


    const accountList = [
        {
            key: 'feishu',
            title: t`Feishu`,
            icon: <FeishuIcon width={18} height={18}></FeishuIcon>,
        }
    ]

    const onUnlink = (provider: SupportedIntegrationProvider, title: string) => {
        setDeletingProvider({
            provider, title
        });
        onOpenDeleteModal();
    }

    return (
        <>
            <SettingsWrapper title="关联第三方账号" >
                {
                    accountList.map(acc => (
                        <SettingsItem data-provider={acc.key} custom key={acc.key} className="justify-between">
                            <div className="flex">
                                <div className="flex items-center w-[110px]">
                                    {acc.icon}
                                    <span className="text-sm ml-2">{acc.title}</span>
                                </div>
                                <div className="flex items-center ml-4 text-sm text-gray-500">
                                    {appsMap["feishu"]?.bindAccount && (
                                        <>
                                            <CheckCircleIcon className="w-4 h-4 text-green-500 inline-block mr-1" />
                                            <span>{t`Linked`}</span>
                                        </>
                                    )
                                    }
                                </div>
                            </div>

                            <div className="mr-2">
                                {!appsMap["feishu"]?.bindAccount ?
                                    (<Link color="foreground" size="sm" className="cursor-pointer text-gray-600 dark:text-white" onClick={onBindFeishu}>
                                        <LinkIcon className="w-4 h-4 mr-2" />
                                        {t`Link`}
                                    </Link>) : (<><Link color="foreground" size="sm" className="cursor-pointer text-gray-600 dark:text-white" onClick={() => onUnlink(acc.key as SupportedIntegrationProvider, acc.title)}>
                                        <LinkSlashIcon className="w-4 h-4 mr-2" />
                                        {t`Unlink`}
                                    </Link></>)
                                }
                            </div>
                        </SettingsItem>
                    ))
                }
            </SettingsWrapper>
            <Modal isOpen={isOpenDeleteModal} onOpenChange={onOpenChangeDeleteModal} title={i18n._(t`Unlink Account`)}>
                <ModalContent>
                    {
                        (onClose) => (
                            <>
                                <ModalHeader>
                                    {i18n._(t`Unlink Account`)}
                                </ModalHeader>
                                <ModalBody>
                                    <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-800">
                                        <div className="flex items-start gap-3">
                                            <ExclamationTriangleIcon className="w-6 h-6  flex-shrink-0" />
                                            <div className="space-y-1">
                                                <p className="font-semibold text-red-700">
                                                    {i18n._(`Are you sure you want to unlink {provider} account?`, {
                                                        provider: deletingProvider?.title,
                                                    })}
                                                </p>
                                                <p className="text-sm">
                                                    {i18n._(`This action cannot be undone.`)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </ModalBody>
                                <div className="flex justify-end p-4">
                                    <Button className="mr-2" variant="light" size="sm" onClick={onClose}>{i18n._(t`Cancel`)}</Button>
                                    <Button color="danger" size="sm" onPress={async () => {
                                        if (!deletingProvider) return;
                                        var res = await unlinkIntegrationAccount(deletingProvider.provider);
                                        if (res.code != responseCode.SUCCESS) {
                                            return toast.error(res.error || i18n._(t`Failed to unlink`));
                                        }
                                        toast.success(i18n._(t`Successfully unlinked`));
                                        onClose();
                                    }}>{i18n._(t`Unlink`)}</Button>
                                </div>
                            </>
                        )
                    }

                </ModalContent>
            </Modal>
        </>
    )
}

export default IntegrationAccount