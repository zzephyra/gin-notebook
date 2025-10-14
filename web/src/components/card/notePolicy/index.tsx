// components/PolicyRow.tsx
import { Badge, Tag } from "@douyinfe/semi-ui";
import { Button } from "@heroui/react";
import { PlayIcon, StopIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { useLingui } from "@lingui/react/macro";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import useIntegration from "@/hooks/useIntegration";

export function NotePolicyCard({
    policy,
}: {
    policy: any;
}) {
    const { i18n, t } = useLingui();
    const rel = useRelativeTime(policy.updated_at, i18n); // ✅ 子组件内部用 Hook 安全
    const { thirdPartyIntegrationsMapping } = useIntegration()
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
                    <Button isIconOnly className="w-7 h-7 min-w-0 ml-1" variant="light" radius="full">
                        <EllipsisHorizontalIcon className="w-4 h-4 text-gray-400" />
                    </Button>
                </div>
            </div>

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
