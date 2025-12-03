import { useGithubData } from "@/contexts/GithubContent";
import { formatK } from "@/utils/tools";
import { Button } from "@heroui/button"
import { useLingui } from "@lingui/react/macro"
import { Github, GitFork, Star, Users, BookOpen, MessageCircle } from "lucide-react"

export function OpenSourceSection() {
    const { t } = useLingui();
    const GithubData = useGithubData();
    return (
        <section className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-foreground to-foreground/90 p-8 text-background sm:p-12 lg:p-16">
                    <div className="grid gap-12 lg:grid-cols-2">
                        {/* Content */}
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-4 py-1.5 text-sm">
                                <Github className="h-4 w-4" />
                                {t`Open Source`}
                            </div>

                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                {t`Open-source and transparent`}
                                <br />
                                {t`Community-driven`}
                            </h2>

                            <p className="mt-6 text-md leading-relaxed text-background/80">
                                {t`We believe in the power of open source. Mameos is licensed under MIT licensed under the MIT license, allowing you to use, modify, and distribute it freely. With self-hosting support, your data remains fully under your control.`}
                            </p>

                            <div className="mt-8 flex flex-wrap gap-4">
                                <Button size="lg" className="gap-2 bg-background text-foreground hover:bg-background/90">
                                    <Github className="h-4 w-4" />
                                    {t`View Source`}
                                </Button>
                                <Button
                                    size="lg"
                                    variant="light"
                                    className="gap-2 border-background/30 text-background hover:bg-background/10 bg-transparent"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    {t`Deployment Documentation`}
                                </Button>
                            </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex flex-col justify-center">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {[
                                    { icon: Star, label: "Stars", value: formatK(GithubData?.stargazers_count || 0) },
                                    { icon: GitFork, label: "Forks", value: GithubData?.forks_count || 0 },
                                    { icon: Users, label: t`Contributors`, value: GithubData?.subscribers_count || 0 },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="rounded-xl border border-background/10 bg-background/5 p-4 text-center"
                                    >
                                        <stat.icon className="mx-auto mb-2 h-5 w-5 text-background/60" />
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                        <div className="text-sm text-background/60">{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 rounded-xl border border-background/10 bg-background/5 p-4">
                                <div className="mb-3 text-sm font-medium text-background/80">{t`Join the Community`}</div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="light"
                                        className="gap-2 border-background/30 text-background hover:bg-background/10 bg-transparent"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        Discord
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="light"
                                        className="gap-2 border-background/30 text-background hover:bg-background/10 bg-transparent"
                                    >
                                        <Github className="h-4 w-4" />
                                        {t`Submit Issue`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
