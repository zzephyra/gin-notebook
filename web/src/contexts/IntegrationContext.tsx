import { IntegrationAppPayload } from "@/features/api/type";
import { IntegrationAppMap } from "@/hooks/useIntegration";
import { IconType } from "@/types";
import { IntegrationAccount, IntegrationApp, SupportedIntegrationProvider } from "@/types/integration";
import { MessageDescriptor } from "@lingui/core";
import { createContext, useContext } from 'react';

export interface IntegrationController {
    isLoading: boolean;
    isLoadingAccounts: boolean;
    apps: IntegrationApp[];
    accounts: IntegrationAccount[];
    addNewApp: (app: IntegrationAppPayload) => Promise<any>;
    appsMap: Record<string, IntegrationAppMap>;
    refreshIntegrationAccounts: (provider?: SupportedIntegrationProvider) => Promise<any>;
    unlinkIntegrationAccount: (provider: SupportedIntegrationProvider) => Promise<any>;
    thirdPartyIntegrationsMapping: Record<string, {
        name: MessageDescriptor;
        key: string;
        icon: React.FunctionComponentElement<IconType>;
        description: MessageDescriptor;
    }>;
    thirdPartyIntegrations: {
        name: MessageDescriptor;
        key: string;
        icon: React.FunctionComponentElement<IconType>;
        description: MessageDescriptor;
    }[];
}

const IntegrationContext = createContext<IntegrationController | null>(null);

export const IntegrationProvider = IntegrationContext.Provider;

export function useIntegration() {
    const ctx = useContext(IntegrationContext);
    if (!ctx) throw new Error('useIntegration must be used within IntegrationProvider');
    return ctx;
}

