import { msg } from "@lingui/core/macro"
import { useLingui } from "@lingui/react/macro"
import { Sparkles, Users, LayoutList, FolderTree } from "lucide-react"

const features = [
    {
        key: "ai-assistant",
        icon: Sparkles,
        title: msg`AI Chat Assistant`,
        description: msg`Summarize notes, generate outlines, and answer knowledge-base questions—making writing effortless.`,
        color: "text-primary",
        bg: "bg-primary/10",
    },
    {
        key: "real-time-collaboration",
        icon: Users,
        title: msg`Real-time collaboration`,
        description: msg`Real-time multi-user editing with comments and @mentions to streamline team collaboration.`,
        color: "text-green-600",
        bg: "bg-green-500/10",
    },
    {
        key: "kanban-management",
        icon: LayoutList,
        title: msg`Kanban Task Management`,
        description: msg`Drag tasks between columns, customize views, and see project progress at a glance.`,
        color: "text-orange-600",
        bg: "bg-orange-500/10",
    },
    {
        key: "flexible-organization",
        icon: FolderTree,
        title: msg`Flexible Knowledge Organization`,
        description: msg`Unlimited page hierarchy, tags, and full-text search—build the knowledge system that works for you.`,
        color: "text-blue-600",
        bg: "bg-blue-500/10",
    },
]

export function Features() {
    const { t, i18n } = useLingui()
    return (
        <section id="features" className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t`A collaboration tool built for modern teams`}</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        {t`All your notes, documents, and tasks unified—supercharged by AI.`}
                    </p>
                </div>

                <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => (
                        <div
                            key={feature.key}
                            className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div className={`mb-4 inline-flex rounded-xl p-3 ${feature.bg}`}>
                                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-foreground">{i18n._(feature.title)}</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">{i18n._(feature.description)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
