import { Button } from "@heroui/button";
import { useLingui } from "@lingui/react/macro";
import { motion, AnimatePresence } from "framer-motion";

var PromptStyle: Record<string, any> = {
    translator: {
        label: 'prompt.translator.label',
        description: 'prompt.translator.description',
        Icon: '🌐',
    }
}

const containerVariants = {
    show: {
        transition: {
            staggerChildren: 0.08, // 每个按钮延迟出现
            delayChildren: 0.1,
        },
    },
    hidden: {},
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 }, // 初始：稍微往下
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 10 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }, // 消失时下沉
};

function AIChatPrompt({ prompts }: { prompts: Prompt[] }) {
    const { i18n } = useLingui();

    return (
        <AnimatePresence mode="popLayout">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit="hidden"
                className="flex flex-wrap gap-2"
            >
                {prompts.map((prompt) => (
                    <motion.div key={prompt.intent} variants={itemVariants}>
                        <Button
                            size="sm"
                            radius="full"
                            variant="light"
                            className="border-[1px] !border-neutral-200"
                        >
                            {PromptStyle[prompt.intent]?.Icon || "🤖"}{" "}
                            {i18n._(PromptStyle[prompt.intent].label)}
                        </Button>
                    </motion.div>
                ))}
            </motion.div>
        </AnimatePresence>
    );
}

export default AIChatPrompt;