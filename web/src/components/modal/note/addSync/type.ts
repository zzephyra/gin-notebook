import { SupportedIntegrationProvider } from "@/types/integration";

export interface SynchronizationPolicyPayload { provider?: SupportedIntegrationProvider, conflict_policy: string, mode: string, direction: string, target_note_id?: string }