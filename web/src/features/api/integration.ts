import axiosClient from "@/lib/api/client"
import { integrationAccountApi, integrationAccountsApi, integrationAppApi } from "./routes"
import { IntegrationAppPayload } from "./type"
import { SupportedIntegrationProvider } from "@/types/integration"

export async function CreateAppRequest(data: IntegrationAppPayload) {
    try {
        const res = await axiosClient.post(integrationAppApi, data)
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Create integration app failed"
        }
    }
}

export async function FetchIntegrationApps() {
    try {
        const res = await axiosClient.get(integrationAppApi)
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Fetch integration apps failed"
        }
    }
}

export async function FetchIntegrationAccounts(provider?: SupportedIntegrationProvider) {
    try {
        const res = await axiosClient.get(integrationAccountsApi, { params: { provider } })
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Fetch integration accounts failed"
        }
    }
}

export async function DeleteIntegrationAccount(provider: SupportedIntegrationProvider) {
    try {
        const res = await axiosClient.delete(integrationAccountApi, { data: { provider } })
        return res.data
    } catch (err) {
        return {
            code: 500,
            error: "Delete integration account failed"
        }
    }
}