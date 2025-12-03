import { useLingui } from "@lingui/react/macro"
import { MessageSquare, GitBranch, GripVertical } from "lucide-react"

export function CollaborationSection() {
    const { t } = useLingui();
    const teamMembers = [
        { name: "张三", color: "bg-blue-500" },
        { name: "李四", color: "bg-green-500" },
        { name: "王五", color: "bg-orange-500" },
        { name: "赵六", color: "bg-purple-500" },
    ]

    const kanbanColumns = [
        {
            title: "Todo",
            color: "border-t-slate-400",
            tasks: [
                { title: t`Homepage prototype design`, tag: t`Design`, tagColor: "bg-pink-100 text-pink-700" },
                { title: t`Write API documentation`, tag: t`Document`, tagColor: "bg-blue-100 text-blue-700" },
            ],
        },
        {
            title: "Processing",
            color: "border-t-blue-500",
            tasks: [
                { title: t`Implement user authentication`, tag: t`Develop`, tagColor: "bg-green-100 text-green-700", avatars: 2 },
                { title: t`Database optimization`, tag: t`Develop`, tagColor: "bg-green-100 text-green-700" },
            ],
        },
        {
            title: "Done",
            color: "border-t-green-500",
            tasks: [
                { title: t`Project initialization`, tag: t`Develop`, tagColor: "bg-green-100 text-green-700" },
                { title: t`Requirement analysis`, tag: t`Planning`, tagColor: "bg-purple-100 text-purple-700" },
            ],
        },
    ]

    return (
        <section className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {t`Team collaboration`}, <span className="text-primary">{t`efficient and transparent`}</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                        {t`Real-time multi-user editing, comments and discussions, and Kanban management to streamline team collaboration.`}
                    </p>
                </div>

                <div className="mt-12 grid gap-8 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {teamMembers.map((member, i) => (
                                    <div
                                        key={i}
                                        className={`flex h-10 w-10 items-center justify-center rounded-full ${member.color} text-sm font-medium text-white ring-2 ring-card`}
                                    >
                                        {member.name[0]}
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm text-muted-foreground">{t`4 team members are collaborating`}</span>
                        </div>

                        {/* Document with comments */}
                        <div className="rounded-xl border border-border bg-background p-4">
                            <div className="mb-3 text-base font-semibold text-foreground">{t`Product Requirements Document v2.0`}</div>
                            <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <div className="h-3 w-full rounded bg-muted" />
                                        <div className="mt-1 h-3 w-3/4 rounded bg-muted" />
                                    </div>
                                    <div className="rounded-lg border border-border bg-yellow-50 p-2">
                                        <div className="flex items-center gap-1 text-xs">
                                            <MessageSquare className="h-3 w-3 text-yellow-600" />
                                            <span className="font-medium text-yellow-700">{t`Li`}</span>
                                        </div>
                                        <p className="mt-1 text-xs text-yellow-600">{t`More details need to be added here.`}</p>
                                    </div>
                                </div>
                                <div className="h-3 w-full rounded bg-muted" />
                                <div className="h-3 w-5/6 rounded bg-muted" />
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                <GitBranch className="h-3 w-3" />
                                <span>{t`Version 12 · Last updated 2 minutes ago`}</span>
                            </div>
                        </div>
                    </div>

                    {/* Kanban */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <div className="mb-4 text-base font-semibold text-foreground">{t`Project Kanban Board`}</div>
                        <div className="grid grid-cols-3 gap-3">
                            {kanbanColumns.map((column) => (
                                <div key={column.title} className={`rounded-lg border-t-2 ${column.color} bg-muted/50 p-2`}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-medium text-muted-foreground">{column.title}</span>
                                        <span className="rounded-full bg-background px-1.5 text-xs text-muted-foreground">
                                            {column.tasks.length}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {column.tasks.map((task, i) => (
                                            <div
                                                key={i}
                                                className="group cursor-grab rounded-md border border-border bg-background p-2 shadow-sm transition-shadow hover:shadow-md"
                                            >
                                                <div className="mb-1 flex items-start justify-between">
                                                    <span className="text-xs font-medium text-foreground">{task.title}</span>
                                                    <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${task.tagColor}`}>{task.tag}</span>
                                                    {task.avatars && (
                                                        <div className="flex -space-x-1">
                                                            <div className="h-4 w-4 rounded-full bg-blue-500 ring-1 ring-background" />
                                                            <div className="h-4 w-4 rounded-full bg-green-500 ring-1 ring-background" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
