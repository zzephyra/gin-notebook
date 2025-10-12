export type SupportedIntegrationProvider = "feishu" | "slack";
export type IntegrationEnvironment = "prod" | "dev";


export interface IntegrationApp {
    id: string;
    app_name: string;
    provider: SupportedIntegrationProvider;
    created_at: string;
    updated_at: string;
    env: IntegrationEnvironment
    is_active: boolean;
    app_id: string;
}

export interface IntegrationAccount {
    id: string;
    provider: SupportedIntegrationProvider;
    account_id: string; // 第三方平台的用户 ID
    account_name: string; // 第三方平台的用户名
    is_active: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: any;
    // 其他字段根据需要添加
}