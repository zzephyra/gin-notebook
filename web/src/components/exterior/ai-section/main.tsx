import { useLingui } from "@lingui/react/macro"
import { Sparkles, FileText, ListTodo, HelpCircle } from "lucide-react"

export function AISection() {
    const { t } = useLingui()
    return (
        <section className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                    {/* Chat UI Mock */}
                    <div className="order-2 lg:order-1">
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <span className="font-semibold text-foreground">{t`AI Assistant`}</span>
                            </div>

                            <div className="space-y-4">
                                {/* User message */}
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                                        {t`Help me organize today’s meeting notes and extract the action items.`}
                                    </div>
                                </div>

                                {/* AI response */}
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground">
                                        <p className="mb-2">{t`Alright, I've summarized the three action items from today's meeting:`}</p>
                                        <ul className="space-y-1 text-muted-foreground">
                                            <li>• {t`Complete the product prototype design — @Zhang — before Friday`}</li>
                                            <li>• {t`Prepare the client demo materials — @Li — next Monday`}</li>
                                            <li>• {t`Update the project timeline — @Wang — today`}</li>
                                        </ul>
                                        <p className="mt-2 text-muted-foreground">{t`Would you like me to add these to the Kanban board?`}</p>
                                    </div>
                                </div>

                                {/* User follow-up */}
                                <div className="flex justify-end">
                                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
                                        {t`Alright, please add them to the “This Week’s Tasks” Kanban board.`}
                                    </div>
                                </div>

                                {/* AI confirmation */}
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground">
                                        ✅ {t`I’ve added the three tasks to the “This Week’s Tasks” Kanban board and notified the relevant members.`}
                                    </div>
                                </div>

                                {/* Input */}
                                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2">
                                    <input
                                        type="text"
                                        placeholder={t`Type your message...`}
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                    />
                                    <button className="rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90">
                                        <Sparkles className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="order-1 lg:order-2">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                            <Sparkles className="h-4 w-4" />
                            {t`AI Assistant`}
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            {t`Let AI become your`}
                            <br />
                            <span className="text-primary">{t`writing and collaboration partner`}</span>
                        </h2>

                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            {t`A built-in intelligent AI assistant that supports your work anytime. From content generation to task management—everything happens through conversation.`}
                        </p>

                        <div className="mt-8 space-y-4">
                            {[
                                { icon: FileText, text: t`Organize meeting notes and automatically extract key information` },
                                { icon: ListTodo, text: t`Generate to-dos and add them to your Kanban board instantly` },
                                { icon: HelpCircle, text: t`Fast Q&A powered by your knowledge base` },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                        <item.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="text-foreground">{item.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
