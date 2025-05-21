/*
    设置主文件，文件夹内其他文件均为子文件，最终合并在该文件内
*/
import { useState } from 'react';
import { Listbox, ListboxItem, ListboxSection, Card, CardBody, menuItem } from "@heroui/react";
import { useLingui } from '@lingui/react/macro';
import AccountSettings from './accountSettings';
import StorageSettings from './storageSettings';

const SettingsPage = () => {
    const [selectedKey, setSelectedKey] = useState('account');
    const { t, i18n } = useLingui();

    const menuList = [
        {
            title: 'User',
            children: [
                {
                    key: 'account',
                    title: 'Account',
                    component: <AccountSettings />
                },
            ]
        },
        {
            title: 'System',
            children: [
                {
                    key: 'storage',
                    title: 'Storage',
                    component: <StorageSettings />
                }
            ]
        }
    ]

    const findSelectedComponent = () => {
        for (const item of menuList) {
            if (item.children) {
                for (const child of item.children) {
                    if (child.key === selectedKey) {
                        return child.component;
                    }
                }
            }
        }
        return null;
    };


    return (
        <div className='px-4 py-6 flex-1 gap-2 flex overflow-auto lg:flex-row md:flex-col sm:flex-col flex-col'>
            <div>
                <Card className='w-[16rem]'>
                    <CardBody>
                        <Listbox>
                            {menuList.map((item) => (
                                <ListboxSection key={item.title} title={i18n._(item.title)}>
                                    {item.children.map((childrenItem) => (
                                        <ListboxItem key={childrenItem.key} onPress={() => setSelectedKey(childrenItem.key)}>
                                            {i18n._(childrenItem.title)}
                                        </ListboxItem>
                                    ))}
                                </ListboxSection>
                            ))}
                        </Listbox>
                    </CardBody>
                </Card>
            </div>
            <Card className='flex-1 !overflow-visible'>
                <CardBody className='items-center'>
                    <div className='w-full lg:w-[36rem] py-5'>
                        {findSelectedComponent()}
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}

export default SettingsPage;