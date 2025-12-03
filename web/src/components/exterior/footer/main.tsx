import { useLingui } from "@lingui/react/macro";
import { FileText, Github, MessageCircle, BookOpen } from "lucide-react"

export function Footer() {
    const { t } = useLingui();

    const footerLinks = {
        [t`Product`]: [t`Features`, t`Changelog`, t`Roadmap`, t`Pricing`],
        [t`Resources`]: [t`Documentation`, t`API Reference`, t`Example Projects`, t`Blog`],
        [t`Community`]: ["GitHub", "Discord", "Telegram", t`Contribution Guide`],
        [t`About`]: [t`About Us`, t`Contact`, t`Privacy Policy`, t`Terms of Service`],
    };

    return (
        <footer className="border-t border-border bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                <div className="grid gap-8 lg:grid-cols-6">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <FileText className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold text-foreground">Mameos</span>
                        </div>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                            {t`An open-source collaborative note-taking and knowledge space. AI-powered writing, real-time collaboration, and self-hosted data control.`}
                        </p>
                        <div className="mt-6 flex gap-4">
                            <a href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                                <MessageCircle className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                                <BookOpen className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                        © 2025 Mameos. {t`Open-sourced under the MIT License.`}
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                            {t`Privacy Policy`}
                        </a>
                        <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
                            {t`Terms of Service`}
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    )
}
