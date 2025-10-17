import { MenuItem } from "@/components/menu/type";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { Cog6ToothIcon, NewspaperIcon, StarIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Vite + HeroUI",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Docs",
      href: "/docs",
    },
    {
      label: "Pricing",
      href: "/pricing",
    },
    {
      label: "Blog",
      href: "/blog",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Projects",
      href: "/projects",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Calendar",
      href: "/calendar",
    },
    {
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/frontio-ai/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};

export const getMenuItems = (id: string): MenuItem[] => [
  {
    label: "Notes",
    icon: NewspaperIcon,
    key: "notes",
    route: `/workspace/${id}`,
  },
  {
    label: `Favorites`,
    icon: StarIcon,
    key: "favorites",
    route: `/favorites/${id}`,
  },
  {
    label: `Project`,
    icon: ClipboardDocumentCheckIcon,
    key: "project",
    route: `/project/${id}`,
  },
  {
    label: `Tasks`,
    icon: CalendarDaysIcon,
    key: "tasks",
    route: `/tasks/${id}`,
  },
  {
    label: `Settings`,
    icon: Cog6ToothIcon,
    key: "settings",
    route: `/settings/${id}`,
  },
];