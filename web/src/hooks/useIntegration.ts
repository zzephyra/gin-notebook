import { CreateAppRequest, DeleteIntegrationAccount, FetchIntegrationAccounts, FetchIntegrationApps } from "@/features/api/integration";
import { IntegrationAppPayload } from "@/features/api/type";
import { responseCode } from "@/features/constant/response";
import { IntegrationAccount, IntegrationApp, SupportedIntegrationProvider } from "@/types/integration";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, createElement } from "react";
import FeishuIcon from "@/components/icons/feishu"
import NotionIcon from "@/components/icons/notion"
import { IconType } from "@/types";
import { msg } from '@lingui/core/macro'
import { MessageDescriptor } from "@lingui/core";

export interface IntegrationAppMap extends IntegrationApp {
    bindAccount: boolean,
    account?: IntegrationAccount
}





export default function useIntegration(opts?: {
    enabledApps?: boolean;
    enabledAccounts?: boolean;
}) {
    const enabledApps = opts?.enabledApps ?? true;
    const enabledAccounts = opts?.enabledAccounts ?? true;

    const qk = ['integration-apps'];
    const aqk = ['integration-accounts'];
    const qc = useQueryClient();

    const {
        data: integrationApps,
        isLoading: isLoadingApps,
    } = useQuery({
        queryKey: qk,
        queryFn: async () => {
            let res = await FetchIntegrationApps()
            return res?.data?.apps || []
        },
        staleTime: 5 * 60 * 1000,
        enabled: enabledApps,
    });

    const addNewApp = useMutation({
        mutationFn: (app: IntegrationAppPayload) =>
            CreateAppRequest(app),
        onSuccess: (server) => {
            qc.setQueryData(qk, (old: any) => {
                return [
                    ...(old || []),
                    server.data,
                ]
            });
        }
    });

    const {
        data: integrationAccounts,
        isLoading: isLoadingAccounts,
    } = useQuery({
        queryKey: aqk,
        queryFn: async () => {
            let res = await FetchIntegrationAccounts()
            return res?.data?.accounts || []
        },
        staleTime: 5 * 60 * 1000,
        enabled: enabledAccounts,
    });


    const refreshIntegrationAccounts = useMutation({
        mutationFn: (provider?: SupportedIntegrationProvider) =>
            FetchIntegrationAccounts(provider),
        onSuccess: (account) => {
            qc.setQueryData(aqk, (old: any) => {
                var refresh_accounts = account?.data?.accounts || [];
                if (!old) return [refresh_accounts];
                return [...old, ...refresh_accounts]
            });
        }
    });


    var thirdPartyIntegrations = [
        {
            name: msg`Feishu`,
            key: "feishu",
            icon: createElement(FeishuIcon),
            description: msg`Feishu is an all-in-one collaboration and communication platform that integrates chat, meetings, calendar, docs, and cloud storage. By connecting Feishu, you can automatically sync your notes or tasks into Feishu Docs for seamless teamwork.`
        }, {
            name: msg`Notion`,
            key: "notion",
            icon: createElement(NotionIcon),
            description: msg`Notion is a powerful tool for note-taking and knowledge management, combining documents, tasks, and databases. Integrating with Notion lets you automatically sync your notes into Notion pages for smooth, bidirectional content updates.`
        }
    ]

    const appsMapping = useMemo(() => {
        if (!integrationApps) return {};
        const map: Record<string, IntegrationAppMap> = {};
        integrationApps.forEach((app: IntegrationApp) => {
            var account = integrationAccounts?.find((acc: IntegrationAccount) => acc.provider === app.provider)
            map[app.provider] = {
                ...app,
                bindAccount: !!account,
                account: account,
            };
        });
        return map;
    }, [integrationApps, integrationAccounts]);

    const unlinkIntegrationAccount = useMutation({
        mutationFn: (provider: SupportedIntegrationProvider) =>
            DeleteIntegrationAccount(provider),
        onSuccess: (data, provider) => {
            if (data.code != responseCode.SUCCESS) return;
            qc.setQueryData(aqk, (old: any) => {
                if (!old) return [];
                return old.filter((acc: IntegrationAccount) => acc.provider !== provider);
            });
        }
    });

    var thirdPartyIntegrationsMapping = useMemo(() => {
        return thirdPartyIntegrations.reduce((acc, curr) => {
            acc[curr.key] = curr;
            return acc;
        }, {} as Record<string, {
            name: MessageDescriptor;
            key: string;
            icon: React.FunctionComponentElement<IconType>;
            description: MessageDescriptor;
        }>);
    }, [thirdPartyIntegrations])

    return {
        apps: integrationApps || [],
        accounts: integrationAccounts || [],
        refreshIntegrationAccounts: refreshIntegrationAccounts.mutateAsync,
        unlinkIntegrationAccount: unlinkIntegrationAccount.mutateAsync,
        isLoading: isLoadingApps,
        isLoadingAccounts,
        addNewApp: addNewApp.mutateAsync,
        appsMap: appsMapping,
        thirdPartyIntegrationsMapping,
        thirdPartyIntegrations
    }
}