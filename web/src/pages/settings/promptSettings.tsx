import PromptItem from "@/components/ai/promptItem";
import SettingsItem from "@/components/setting/item";
import SettingsWrapper from "@/components/setting/wrapper";
import { deleteAIPromptRequest, getAIPromptRequest, updateAIPromptRequest } from "@/features/api/ai";
import { responseCode } from "@/features/constant/response";
import { Button, Card } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useEffect, useState } from "react";

function PromptsSettings() {
    const { t } = useLingui();
    const [prompts, setPrompts] = useState<Prompt[]>([]);

    useEffect(() => {
        getAIPromptRequest().then((res) => {
            setPrompts(res.data.prompts);
        })
    }, []);

    const handleDeletePrompt = (prompt: Prompt) => {
        deleteAIPromptRequest(prompt.id).then((res) => {
            if (res.code === responseCode.SUCCESS) {
                setPrompts(prompts.filter(p => p.id !== prompt.id));
            }
        })
    }

    const handleUpdatePrompt = (prompt_id: string, data: Partial<Prompt>) => {
        updateAIPromptRequest(prompt_id, data).then((res) => {
            if (res.code === responseCode.SUCCESS) {
                setPrompts(prompts.map(p => {
                    if (p.id === prompt_id) {
                        return { ...p, ...data };
                    }
                    return p;
                }))
            }
        })
    }

    return <>
        <SettingsWrapper title={t`Prompt Settings`} className="flex-1 h-full" itemClasses="flex-1">
            <SettingsItem custom className="flex-col flex-1 border-[1px] rounded-md border-neutral-200 p-4 flex bg-white">
                {
                    prompts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-center text-neutral-500 py-12 space-y-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-14 h-14 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M12 4v16m8-8H4" />
                            </svg>
                            <div className="text-lg font-medium text-gray-600">
                                {t`No Prompts Yet`}
                            </div>
                            <div className="text-sm text-gray-400">
                                {t`You haven’t added any prompts. Click below to create one.`}
                            </div>
                            <Button
                                color="primary"
                                variant="flat"
                                // onPress={handleCreatePrompt}
                                className="mt-4"
                            >
                                {t`Create Prompt`}
                            </Button>
                        </div>
                    ) : (
                        prompts.map((prompt) => (
                            <div key={prompt.id} className="w-full">
                                <Card className="hover:bg-gray-100 h-[50px] px-2 transition-all">
                                    <PromptItem
                                        onSave={handleUpdatePrompt}
                                        onDelete={handleDeletePrompt}
                                        prompt={prompt}
                                    />
                                </Card>
                            </div>
                        ))
                    )
                }
            </SettingsItem>
        </SettingsWrapper>

    </>
}

export default PromptsSettings;