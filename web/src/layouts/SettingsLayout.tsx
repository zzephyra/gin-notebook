// SettingsLayout.tsx
import { Suspense, useMemo } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Listbox, ListboxItem, ListboxSection, Card, CardBody } from "@heroui/react";
import { useLingui } from "@lingui/react/macro";
import { useSelector } from "react-redux";
import { IntegrationProvider } from "@/contexts/IntegrationContext";
import useIntegration from "@/hooks/useIntegration";

type MenuGroup = {
    title: string;
    children: { key: string; title: string; path: string }[];
};

export default function SettingsLayout() {
    const { t } = useLingui();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // workspace/user/project id
    const state = useSelector((s: any) => s);

    const isSystemAdmin = (state.user.role as string[])?.includes("admin") ?? false;
    const isWorkspaceAdmin =
        (state.workspace.currentWorkspace?.roles as string[])?.includes("admin") ?? false;

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
                    { key: "integration", title: t`Integration`, path: `${base}/integration` },
                ],
            });
        }

        return groups;
    }, [t, base, isWorkspaceAdmin, isSystemAdmin]);

    // 当前选中的 path（用于 Listbox 的受控选中）
    const selectedPath = useMemo(() => {
        // 没有子路径时，让 /settings/:id 也高亮到 Account
        if (location.pathname === base) return `${base}/account`;
        return location.pathname;
    }, [location.pathname, base]);

    const onSelect = (nextPath: string) => {
        if (nextPath !== selectedPath) navigate(nextPath);
    };

    return (
        <div className="px-4 py-6 flex-1 gap-2 flex overflow-auto lg:flex-row md:flex-col sm:flex-col flex-col">
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
    );
}