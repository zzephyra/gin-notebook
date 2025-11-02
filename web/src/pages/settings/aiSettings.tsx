import SettingsItem from "@/components/setting/item"
import SettingsWrapper from "@/components/setting/wrapper"
import { RootState } from "@/store";
import { Button, Form, Input, NumberInput, Select, SelectItem, SharedSelection } from "@heroui/react"
import { useLingui } from "@lingui/react/macro";
import { useState } from "react";
import _ from 'lodash';      // 深拷贝，避免直接修改原对象
import { useSelector } from "react-redux";
import { diffObjects } from "@/utils/tools";
import toast from "react-hot-toast";
import { updateSystemSettingsRequest } from "@/features/api/settings";
import { isNonEmpty, isPositiveInt, isValidUrl } from "@/utils/validate";
import { i18n } from "@lingui/core";
import { responseCode } from "@/features/constant/response";

type AISettingsType = {
    ai_provider: string;
    ai_model?: string;
    ai_input_max_tokens: number;
    ai_output_max_tokens: number;
    ai_api_key?: string;
    ai_api_url?: string;
}

type ModelMeta = {
    provider: string;
    model: string;
    label: string;
    contextWindow: number;      // 模型总上下文容量（tokens）
    maxOutputTokens: number;   // 官方单次生成上限（如有）
    maxInputTokens: number;    // 如果你想单独限制输入上限
    minInput: number;
    maxInput: number;          // 如果你想单独限制输入上限
    minOutput: number;
    maxOutput: number;
};

const MODEL_TABLE: ModelMeta[] = [
    { provider: "openai", model: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", maxInputTokens: 8192, contextWindow: 16385, maxOutputTokens: 4096, minInput: 8000, maxInput: 200000, minOutput: 4000, maxOutput: 16000 },
    { provider: "openai", model: "gpt-4", label: "GPT-4", maxInputTokens: 8192, contextWindow: 8192, maxOutputTokens: 4096, minInput: 8000, maxInput: 200000, minOutput: 4000, maxOutput: 16000 },
    { provider: "anthropic", model: "claude-2", label: "Claude 2", maxInputTokens: 100000, contextWindow: 100000, maxOutputTokens: 4096, minInput: 8000, maxInput: 200000, minOutput: 4000, maxOutput: 16000 },
    { provider: "deepseek", model: "deepseek-reasoner", maxInputTokens: 32000, label: "DeepSeek AI", contextWindow: 32000, maxOutputTokens: 8000, minInput: 8000, maxInput: 200000, minOutput: 4000, maxOutput: 16000 },
    // deepseek / 其他模型… 记得补齐
];

function AISettings() {
    const { t } = useLingui()
    const [errors, setErrors] = useState({});

    const draftSystemSetting = useSelector((s: RootState) => s.settings.system)
    const SupportedModal = [
        {
            provider: "openai",
            value: "gpt-3.5-turbo",
            label: "GPT-3.5 Turbo",
            contextWindow: 16385, maxOutputTokens: 4096, minInput: 8000, maxInput: 200000, minOutput: 4000, maxOutput: 16000,
        },
        {
            provider: "openai",
            value: "gpt-4",
            label: "GPT-4",
            maxInputTokens: 8192,
            maxOutputTokens: 4096,
        },
        {
            provider: "anthropic",
            value: "claude-2",
            label: "Claude 2",
            maxInputTokens: 100000,
            maxOutputTokens: 4096,
        },
        {
            provider: "deepseek",
            value: "deepseek-reasoner",
            label: "DeepSeek AI",
            maxInputTokens: 32000,
            maxOutputTokens: 8000,
        },
        {
            provider: "custom",
            value: "custom",
            label: "Custom Model",
            maxInputTokens: 8000,
            maxOutputTokens: 8000,
        }
    ];
    const getModelMeta = (provider?: string, model?: string) =>
        MODEL_TABLE.find(m => m.provider === provider && m.model === model);


    var [aiSettings, setAISettings] = useState<AISettingsType>({
        ai_provider: draftSystemSetting.ai_provider || "openai",
        ai_model: draftSystemSetting.ai_model,
        ai_input_max_tokens: draftSystemSetting.ai_input_max_tokens || 8192,
        ai_output_max_tokens: draftSystemSetting.ai_output_max_tokens || 2048,
        ai_api_key: draftSystemSetting.ai_api_key,
        ai_api_url: draftSystemSetting.ai_api_url,
    });

    var handleModelChange = (key: SharedSelection) => {
        var selectedModal = MODEL_TABLE.find(m => m.model === key.anchorKey);
        if (selectedModal) {
            var modelSetting: AISettingsType = {
                ai_provider: selectedModal.provider,
                ai_input_max_tokens: selectedModal.maxInputTokens,
                ai_output_max_tokens: selectedModal.maxOutputTokens,
            }

            if (selectedModal.provider !== 'custom') {
                modelSetting = {
                    ...modelSetting,
                    ai_model: selectedModal.model,
                }
            }
            setAISettings({ ...aiSettings, ...modelSetting });
        }
    }

    function validateAISettings(next: AISettingsType, diff: Partial<Record<keyof AISettingsType, unknown>>): Record<string, string> {
        const _errors: Record<string, string> = {};

        // 基础字段裁剪
        const provider = next.ai_provider?.trim();
        const model = next.ai_model?.trim();

        // 1) provider / model 选择有效性
        if ("ai_provider" in diff) {
            if (!isNonEmpty(provider)) _errors["ai_provider"] = t`"Please select a valid AI provider"`;
        }
        if ("ai_model" in diff || "ai_provider" in diff) {
            if (!isNonEmpty(model)) {
                _errors["ai_model"] = t`Please select a valid AI model`;
            } else if (provider !== "custom" && !getModelMeta(provider, model)) {
                _errors["ai_model"] = t`Selected model is not supported by the chosen provider`
            }
        }

        // 2) 数值有效性（单字段）
        if ("ai_input_max_tokens" in diff) {
            const v = next.ai_input_max_tokens;
            if (!isPositiveInt(v)) _errors["ai_input_max_tokens"] = t`Max Input Tokens must be a positive integer`;
        }
        if ("ai_output_max_tokens" in diff) {
            const v = next.ai_output_max_tokens;
            if (!isPositiveInt(v)) _errors["ai_output_max_tokens"] = t`Max Output Tokens must be a positive integer`;
        }

        // 3) custom provider 专属要求
        if (provider === "custom") {
            // 如果切到 custom 或 custom 相关字段变更，就做校验
            if ("ai_provider" in diff || "ai_api_url" in diff || "ai_api_key" in diff || "ai_model" in diff) {
                if (!isValidUrl(next.ai_api_url)) _errors["ai_api_url"] = t`Please provide a valid API URL`;
                if (!isNonEmpty(next.ai_api_key)) _errors["ai_api_key"] = t`API Key is required for custom provider`;
                if (!isNonEmpty(model)) _errors["ai_model"] = t`Please select a valid AI model`;
            }
        }

        // 4) 组合约束：和模型上下文的关系
        // 当 provider/model / input/output 任一发生变化时校验
        const comboChanged =
            "ai_provider" in diff || "ai_model" in diff ||
            "ai_input_max_tokens" in diff || "ai_output_max_tokens" in diff;

        if (comboChanged) {
            const meta = provider === "custom" ? undefined : getModelMeta(provider, model);

            const inMax = next.ai_input_max_tokens ?? 0;
            const outMax = next.ai_output_max_tokens ?? 0;

            // 4.1 你的全局硬限制（保留）：输入 [8000, 200000]，输出 [4000, 16000]
            if (isPositiveInt(inMax)) {
                if (inMax > 200000) _errors["ai_input_max_tokens"] = t`Max Input Tokens cannot exceed 200000`;
                else if (inMax < 8000) _errors["ai_input_max_tokens"] = t`Max Input Tokens cannot be less than 8000`;
            }
            if (isPositiveInt(outMax)) {
                if (outMax > 16000) _errors["ai_output_max_tokens"] = t`Max Output Tokens cannot exceed 16000`;
                else if (outMax < 4000) _errors["ai_output_max_tokens"] = t`Max Output Tokens cannot be less than 4000`;
            }

            // 4.2 模型级别的限制（如果能匹配到官方上下文）
            if (meta) {
                // 单模型可选的更严格范围（可选）
                if (meta.minInput && inMax < meta.minInput) _errors["ai_input_max_tokens"] = i18n._("Input tokens cannot be less than {minInput} for {model}", { minInput: meta.minInput, model: meta.model });
                if (meta.maxInput && inMax > meta.maxInput) _errors["ai_input_max_tokens"] = i18n._("Input tokens cannot exceed {maxInput} for {model}", { maxInput: meta.maxInput, model: meta.model });
                if (meta.minOutput && outMax < meta.minOutput) _errors["ai_output_max_tokens"] = i18n._("Output tokens cannot be less than {minOutput} for {model}", { minOutput: meta.minOutput, model: meta.model });
                if (meta.maxOutput && outMax > meta.maxOutput) _errors["ai_output_max_tokens"] = i18n._("Output tokens cannot exceed {maxOutput} for {model}", { maxOutput: meta.maxOutput, model: meta.model });

                // 核心组合：输入 + 输出 ≤ 上下文窗口
                if (isPositiveInt(inMax) && isPositiveInt(outMax)) {
                    if (inMax + outMax > meta.contextWindow) {
                        _errors["ai_input_max_tokens"] = i18n._("The sum of Input and Output tokens cannot exceed the context window of {contextWindow} for {model}", { contextWindow: meta.contextWindow, model: meta.model });
                    }
                }
            }
        }

        return _errors;
    }

    var submitAISettings = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        var diff = diffObjects(aiSettings, draftSystemSetting)
        const errors = validateAISettings(aiSettings, diff);
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }

        if (Object.keys(diff).length === 0) {
            toast.error(t`No changes detected in AI Settings`);
            return;
        }

        var res = await updateSystemSettingsRequest(diff)
        if (res.code == responseCode.SUCCESS) {
            toast.success(t`AI Settings updated successfully`);
            return;
        } else {
            toast.error(t`Failed to update AI Settings`);
        }

    }

    return (
        <>
            <Form validationErrors={errors} onSubmit={submitAISettings}>
                <SettingsWrapper title={t`AI Settings`} className="w-full" >
                    <SettingsItem className="mt-2" label={t`Select AI Model`} description={t`After selecting a model, some settings will be generated automatically. If you choose a custom model, you’ll need to manually complete the remaining parameters.`} >
                        <Select disallowEmptySelection onSelectionChange={handleModelChange} className="min-w-[200px]" name="model" defaultSelectedKeys={aiSettings.ai_provider == "custom" ? ["custom"] : [aiSettings.ai_provider + "_" + aiSettings.ai_model]}>
                            {
                                [...MODEL_TABLE, { provider: "custom", maxInputTokens: 32000, model: "custom", label: t`Custom Model`, contextWindow: 8192, maxOutputTokens: 4096, minInput: 8000, maxInput: 200000, minOutput: 4000, maxOutput: 16000 }].map(model => (
                                    <SelectItem key={model.provider != "custom" ? model.provider + "_" + model.model : "custom"}>{model.label}</SelectItem>
                                ))

                            }
                        </Select>
                    </SettingsItem>
                    {
                        aiSettings.ai_model === 'custom' && (
                            <SettingsItem label={t`Custom Model Endpoint`} description={t`Please provide the API endpoint for your custom AI model.`} >
                                <Input size="sm" className="min-w-[300px]" name="custom_model_endpoint" placeholder={t`Enter your custom model API endpoint here`} />
                            </SettingsItem>
                        )
                    }
                    <SettingsItem label={t`Max Input Tokens`} description={t`Set the maximum number of input tokens for the selected AI model. The maximum allowed value is 200000.`} >
                        <NumberInput
                            value={aiSettings.ai_input_max_tokens}
                            radius="lg"
                            maxValue={200000}
                            minValue={8000}
                            name="ai_input_max_tokens"
                            placeholder="Enter the amount"
                            onValueChange={(v) => setAISettings({ ...aiSettings, ai_input_max_tokens: v })}
                            hideStepper
                            size="sm"
                        />
                    </SettingsItem>
                    <SettingsItem label={t`Max Output Tokens`} description={t`Set the maximum number of output tokens for the selected AI model. The maximum allowed value is 16000.`}>
                        <NumberInput
                            value={aiSettings.ai_output_max_tokens}
                            hideStepper
                            size="sm"
                            name="ai_output_max_tokens"
                            radius="lg"
                            maxValue={16000}
                            minValue={4000}
                            onValueChange={(v) => setAISettings({ ...aiSettings, ai_output_max_tokens: v })}
                            placeholder="Enter the amount"
                        />
                    </SettingsItem>
                    <SettingsItem label={t`Model API key`} description={t`Please provide the API key for your selected AI model.`} >
                        <Input name="ai_api_key" onValueChange={(v) => setAISettings({ ...aiSettings, ai_api_key: v })} defaultValue={draftSystemSetting.ai_api_key || ""} >

                        </Input>
                    </SettingsItem>
                    <SettingsItem label={t`Model API URL`} description={t`The base URL of the model API. Required if you are using a custom model or self-hosted service.`} >
                        <Input name="ai_api_url" type="url" defaultValue={draftSystemSetting.ai_api_url || ""} onValueChange={(v) => setAISettings({ ...aiSettings, ai_api_url: v })}>

                        </Input>
                    </SettingsItem>
                </SettingsWrapper>
                <SettingsItem>
                    <Button size="sm" color="primary" type="submit">
                        {t`Submit`}
                    </Button>
                </SettingsItem>
            </Form >
        </>
    )
}

export default AISettings