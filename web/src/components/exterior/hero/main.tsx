import { useGithubData } from "@/contexts/GithubContent"
import { formatK } from "@/utils/tools"
import { Button } from "@heroui/button"
import { useLingui } from "@lingui/react/macro"
import { Github, ArrowRight, Sparkles, LayoutList, FileText } from "lucide-react"

export function Hero() {
    const { t, i18n } = useLingui()
    const GithubData = useGithubData()

    return (
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 left-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-3xl" />
            </div>

            <div className="mx-auto max-w-7xl">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <div className="text-center lg:text-left">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span>{t`Open-source & free · Self-hosted deployment`}</span>
                        </div>

                        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                            {t`Open-source collaborative notes`}
                            <span className="text-primary"> {t`for shared knowledge spaces`}</span>
                        </h1>

                        <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
                            {t`AI-enhanced writing, real-time collaborative editing, and Kanban-style task management.`}
                            <br className="hidden sm:block" />
                            {t`Self-hosted, data-secure, and fully open-source.`}
                        </p>

                        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                            <Button size="md" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                                {t`Try Now`}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button size="md" variant="light" className="gap-2 bg-transparent" onPress={() => GithubData?.html_url && window.open(GithubData.html_url)}>
                                <Github className="h-4 w-4" />
                                {t`GitHub Repository`}
                            </Button>
                        </div>

                        <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted-foreground lg:justify-start">
                            <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span>{formatK(GithubData?.stargazers_count || 0)} GitHub Stars</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-primary/10">
                            <div className="flex items-center gap-2 rounded-t-lg bg-muted px-4 py-3">
                                <div className="flex gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-red-400" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                    <div className="h-3 w-3 rounded-full bg-green-400" />
                                </div>
                                <div className="ml-4 flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                                    mameos/workspace
                                </div>
                            </div>

                            <div className="grid grid-cols-12 bg-background rounded-b-lg overflow-hidden">
                                <div className="col-span-3 border-r border-border p-3 min-h-[320px]">
                                    <div className="mb-4 text-xs font-semibold text-muted-foreground">{t`Notes`}</div>
                                    <div className="space-y-1">
                                        {[t`Project Planning`, t`Meeting Notes`, t`Product Documentation`, t`Weekly Team Report`].map((item, i) => (
                                            <div
                                                key={item}
                                                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                <FileText className="h-3 w-3 flex-shrink-0" />
                                                <span className="truncate">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-6 border-r border-border p-4">
                                    <div className="mb-3 text-base font-semibold">{t`Project Planning`}</div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full rounded bg-muted" />
                                        <div className="h-3 w-4/5 rounded bg-muted" />
                                        <div className="h-3 w-3/4 rounded bg-muted" />
                                        <div className="mt-4 h-3 w-full rounded bg-muted" />
                                        <div className="h-3 w-2/3 rounded bg-muted" />
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-blue-500 ring-2 ring-blue-500/30" />
                                        <div className="h-5 w-5 rounded-full bg-green-500 ring-2 ring-green-500/30" />
                                        <span className="text-xs text-muted-foreground">{i18n._("{count} online", { count: 2 })}</span>
                                    </div>
                                </div>

                                <div className="col-span-3 p-3 bg-muted/30">
                                    <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                        <Sparkles className="h-3 w-3 text-primary" />
                                        {t`AI Assistant`}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="rounded-lg bg-background p-2 text-xs text-foreground">{t`Help me summarize the key points of this document.`}</div>
                                        <div className="rounded-lg bg-primary/10 p-2 text-xs text-primary">
                                            {t`Alright, this document mainly covers the following three key points…`}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                                <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                    <LayoutList className="h-3 w-3" />
                                    {t`Kanban View`}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {["Todo", "Processing", "Done"].map((col) => (
                                        <div key={col} className="rounded-md bg-background p-2">
                                            <div className="mb-1 text-xs font-medium text-muted-foreground">{col}</div>
                                            <div className="h-6 rounded bg-muted" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
