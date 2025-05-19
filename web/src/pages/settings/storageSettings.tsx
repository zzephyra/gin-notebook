import SettingsItem from "@/components/setting/item";
import SettingsWrapper from "@/components/setting/wrapper";
import { RootState } from "@/store";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { useSelector } from "react-redux";
import _ from 'lodash';      // 深拷贝，避免直接修改原对象
import { updateSystemSettingsRequest } from "@/features/api/settings";
import { responseCode } from "@/features/constant/response";
import toast from "react-hot-toast";

const StorageSettings = () => {
    const { t, i18n } = useLingui()
    const [updateLoading, setUpdateLoading] = useState(false)
    const draftSystemSetting = useSelector((s: RootState) => s.settings.system)
    const [systemSetting, setSystemSetting] = useState(() => _.cloneDeep(draftSystemSetting))
    // 只要 Redux 版本变化，就覆盖本地副本
    const storageObjectChioces = [
        {
            key: 'local',
            label: 'local'
        },
        {
            key: 'qiniu',
            label: 'qiniu'
        }
    ]
    function handleUpdate(value: object) {
        setSystemSetting((prev) => ({ ...prev, ...value }))
    }

    async function handleSubmitSettings() {
        setUpdateLoading(true)
        try {
            let res = await updateSystemSettingsRequest(systemSetting)
            if (res.code == responseCode.SUCCESS) {
                toast.success(t`Update successfully`)
            }
        } finally {
            setUpdateLoading(false)
        }
    }

    return (
        <>
            <SettingsWrapper title={t`Storage Management`}>
                <SettingsItem label={t`Storage Object`}>
                    <Select aria-label="Storage Object" className="max-w-xs w-32" disallowEmptySelection size="sm" defaultSelectedKeys={[systemSetting.storage_driver]} onSelectionChange={(value) => handleUpdate({ storage_driver: value.currentKey })}>
                        {storageObjectChioces.map((item) => (
                            <SelectItem key={item.key}>
                                {i18n._(item.label)}
                            </SelectItem>
                        ))}
                    </Select>
                </SettingsItem>
                {systemSetting.storage_driver === 'qiniu' && (
                    <>
                        <SettingsItem label={t`Access Key`} description={t`Qi Niu Cloud access key`}>
                            <Input aria-label="Qi Niu Cloud access key" defaultValue={systemSetting.qiniu_ak} onBlur={(e) => handleUpdate({ qiniu_ak: e.target.value })} size="sm"></Input>
                        </SettingsItem>
                        <SettingsItem label={t`Secret Key`} description={t`Qi Niu Cloud secret key`}>
                            <Input aria-label="Qi Niu Cloud secret key" defaultValue={systemSetting.qiniu_sk} onBlur={(e) => handleUpdate({ qiniu_sk: e.target.value })} size="sm"></Input>
                        </SettingsItem>
                        <SettingsItem label={t`Bucket Name`} description={t`Qi Niu Cloud bucket name`}>
                            <Input aria-label="Qi Niu Cloud bucket name" defaultValue={systemSetting.qiniu_bucket} onBlur={(e) => handleUpdate({ qiniu_bucket: e.target.value })} size="sm"></Input>
                        </SettingsItem>
                        <SettingsItem label={t`Domain Url`} description={t`Qi Niu Cloud domain url`}>
                            <Input aria-label="Qi Niu Cloud domain url" defaultValue={systemSetting.qiniu_domain} onBlur={(e) => handleUpdate({ qiniu_domain: e.target.value })} size="sm"></Input>
                        </SettingsItem>
                        <SettingsItem label={t`Region`} description={t`Qi Niu Cloud region`}>
                            <Input aria-label="Qi Niu Cloud region" defaultValue={systemSetting.qiniu_region} onBlur={(e) => handleUpdate({ qiniu_region: e.target.value })} size="sm"></Input>
                        </SettingsItem>
                    </>
                )}
                {
                    systemSetting.storage_driver === 'local' && (
                        <>
                            <SettingsItem label={t`Storage Path`} description={t`Local storage path`}>
                                <Input aria-label="Local storage path" defaultValue={systemSetting.storage_path} onBlur={(e) => handleUpdate({ storage_path: e.target.value })} size="sm"></Input>
                            </SettingsItem>
                        </>
                    )
                }
            </SettingsWrapper>
            <div className="absolute bottom-0 right-0 p-4">
                <Button aria-label="update storage settings" type="submit" onPress={handleSubmitSettings} size="sm" color="primary" isLoading={updateLoading}>{t`Save`}</Button>
            </div>
        </>
    )
}

export default StorageSettings