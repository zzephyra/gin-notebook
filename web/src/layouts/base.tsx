import { Outlet } from 'react-router-dom';
import { Select, SelectItem } from "@heroui/react";
import { Trans } from '@lingui/react/macro';
import { ThemeSwitcher } from '@/components/ThemeSwitch/switch';
import { i18n } from '@lingui/core';
import { loadCatalog } from "@/i18n";
const languages = [
  { value: 'en', label: 'English' },
  { value: 'zh_cn', label: '简体中文' },
];

async function changeLanguage(locale: "all" | Set<React.Key> & { anchorKey?: string; currentKey?: string }) {
  if (locale === "all") {
    await loadCatalog(locale);
    i18n.activate(locale);
  } else if (locale instanceof Set && locale.currentKey) {
    const key: string = locale.currentKey;
    await loadCatalog(key);
    i18n.activate(key);
  }

}

export default function BaseLayout() {
  return (
    <div className="flex flex-col h-full">
      <header className="pt-2 flex justify-end gap-2 mr-2 content-center">
        <ThemeSwitcher></ThemeSwitcher>
        <Select onSelectionChange={(key) => { changeLanguage(key) }} defaultSelectedKeys={[i18n.locale]} className='flex-initial w-36 text-sm' size="sm" items={languages} label={<Trans>Languages</Trans>}>
          {(language) => <SelectItem key={language.value}>{language.label}</SelectItem>}
        </Select>
      </header>
      <Outlet />
    </div>
  );
}