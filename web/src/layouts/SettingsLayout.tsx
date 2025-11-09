// SettingsLayout.tsx
import { Suspense, useMemo } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Listbox, ListboxItem, ListboxSection, Card, CardBody } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useSelector } from "react-redux";
import { IntegrationProvider } from "@/contexts/IntegrationContext";
import useIntegration from "@/hooks/useIntegration";
import type { RootState } from "@/store"; // 你的 RootState 类型
import AvatarMenu from "@/components/avatarMenu";
import { useMediaQuery } from "react-responsive";

const selectIsSystemAdmin = (s: RootState) => (s.user.role ?? []).includes("admin");
const selectIsWorkspaceAdmin = (s: RootState) => (s.workspace.currentWorkspace?.roles ?? []).includes("admin");

type MenuGroup = {
    title: string;
    children: { key: string; title: string; path: string }[];
};

export default function SettingsLayout() {
    const { t } = useLingui();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    const isSystemAdmin = useSelector(selectIsSystemAdmin);
    const isWorkspaceAdmin = useSelector(selectIsWorkspaceAdmin);

    const base = `/settings/${id}`;

    const allMenus: MenuGroup[] = useMemo(() => {
        const groups: MenuGroup[] = [
            {
                title: t`User`,
                children: [
                    { key: "account", title: t`Account`, path: `${base}/account` },
                    { key: "bind", title: t`Bind Integration Account`, path: `${base}/bind` },
                ],
            },
        ];

        if (isWorkspaceAdmin) {
            groups.push({
                title: t`Workspace`,
                children: [{ key: "members", title: t`Members`, path: `${base}/members` }],
            });
        }

        if (isSystemAdmin) {
            groups.push({
                title: t`System`,
                children: [
                    { key: "storage", title: t`Storage`, path: `${base}/storage` },
                    { key: "ai", title: t`AI Settings`, path: `${base}/ai` },
                    { key: "prompts", title: t`Prompts`, path: `${base}/prompts` },
                    { key: "integration", title: t`Integration`, path: `${base}/integration` },
                ],
            });
        }

        return groups;
    }, [t, base, isWorkspaceAdmin, isSystemAdmin]);

    const selectedPath = useMemo(() => {
        if (location.pathname === base) return `${base}/account`;
        return location.pathname;
    }, [location.pathname, base]);

    const onSelect = (nextPath: string) => {
        if (nextPath !== selectedPath) navigate(nextPath);
    };

    return (
        <div className="flex-1 flex w-full h-full lg:flex-row md:flex-col sm:flex-col flex-col">
            {
                !isDesktop &&
                <div className="px-6 py-2 sticky top-0 z-50 bg-white dark:bg-[#191919]">
                    {/* You can add a header or breadcrumb here if needed */}
                    <AvatarMenu />
                </div>
            }
            <div className="px-4 pt-4 flex-1 gap-2 flex lg:flex-row md:flex-col sm:flex-col flex-col">
                <div>
                    <Card className="w-[16rem]">
                        <CardBody>
                            <Listbox
                                selectionMode="single"
                                selectedKeys={[selectedPath]}
                                onSelectionChange={(keys) => {
                                    const k = Array.from(keys)[0] as string | undefined;
                                    if (k) onSelect(k);
                                }}
                            >
                                {allMenus.map((group) => (
                                    <ListboxSection key={group.title} title={group.title}>
                                        {group.children.map((child) => (
                                            <ListboxItem key={child.path}>{child.title}</ListboxItem>
                                        ))}
                                    </ListboxSection>
                                ))}
                            </Listbox>
                        </CardBody>
                    </Card>
                </div>

                <Card className="flex-1 !overflow-visible">
                    <CardBody className="items-center">
                        <div className="h-full w-full lg:w-[36rem] py-5">
                            <IntegrationProvider value={useIntegration()}>
                                <Suspense fallback={<div className="text-sm text-gray-500">{t`Loading...`}</div>}>
                                    <Outlet />
                                </Suspense>
                            </IntegrationProvider>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}