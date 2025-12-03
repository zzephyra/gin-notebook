"use client"

import { useState } from "react"
import { Menu, X, Github } from "lucide-react"
import { Button } from "@heroui/button"
import { useGithubData } from "@/contexts/GithubContent"
import { Avatar, Drawer, DrawerContent, Listbox, ListboxItem } from "@heroui/react"
import { useLingui } from "@lingui/react/macro"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import { useNavigate } from "react-router-dom"

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const githubData = useGithubData()
    const { t } = useLingui()
    const navigate = useNavigate()

    const navItems = [
        { name: t`Features`, href: "#features" },
        { name: t`Documents`, href: "#docs" },
        { name: "GitHub", href: "#github" },
        { name: t`Community`, href: "#community" },
    ]
    const user = useSelector((state: RootState) => state.user);
    const workspace = useSelector((state: RootState) => state.workspace);
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground select-none">Mameos</span>
                </div>

                <nav className="hidden items-center gap-3 md:flex">
                    {navItems.map((item) => (
                        <Button
                            variant="light"
                            size="sm"
                            key={item.name}
                            href={item.href}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {item.name}
                        </Button>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 md:flex">
                    {
                        user.isAuth ? (
                            <>
                                <Avatar src={user.avatar} size="sm" />
                                <Button variant="light" size="sm" onPress={() => navigate(workspace.currentWorkspace?.id ? `/workspace/${workspace.currentWorkspace.id}` : "/select")}>
                                    {t`Workspace`}
                                </Button>
                            </>
                        ) : (
                            <Button variant="light" size="sm" onPress={() => navigate("/auth/login")}>
                                {t`Login`}
                            </Button>
                        )
                    }
                    <Button size="sm" className="gap-2 bg-foreground text-background hover:bg-foreground/90" onPress={() => githubData?.html_url && window.open(githubData.html_url)}>
                        <Github className="h-4 w-4" />
                        {t`Star on GitHub`}
                    </Button>
                </div>

                <Button size="md" variant="light" isIconOnly className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </div>


            <Drawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)}>
                <DrawerContent>
                    <div className="border-t h-full border-border md:hidden">
                        <div className="space-y-1 h-full flex flex-col justify-between pt-8 px-4 py-4">
                            <Listbox>
                                {navItems.map((item) => (
                                    <ListboxItem
                                        variant="light"
                                        key={item.name}
                                        href={item.href}
                                    >
                                        {item.name}
                                    </ListboxItem>
                                ))}
                            </Listbox>
                            <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-border">
                                <Button color="primary" className="w-full">
                                    {t`Login`}
                                </Button>
                                <Button className="w-full gap-2 bg-foreground text-background" onPress={() => githubData?.html_url && window.open(githubData.html_url)}>
                                    <Github className="h-4 w-4" />
                                    {t`Star on GitHub`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
            {/* {mobileMenuOpen && (

            )} */}
        </header >
    )
}
