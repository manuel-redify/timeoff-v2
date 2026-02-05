import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/rbac';

export default async function SettingsPage() {
    const adminStatus = await isAdmin();
    const sidebarItems = [
        {
            title: "Company",
            href: "/settings/company",
            isAdmin: true,
        },
        {
            title: "Departments",
            href: "/settings/departments",
            isAdmin: true,
        },
        {
            title: "Bank Holidays",
            href: "/settings/holidays",
            isAdmin: true,
        },
        {
            title: "Leave Types",
            href: "/settings/leave-types",
            isAdmin: true,
        },
        {
            title: "Contract Types",
            href: "/settings/contract-types",
            isAdmin: true,
        },
        {
            title: "Roles",
            href: "/settings/roles",
            isAdmin: true,
        },
        {
            title: "Areas",
            href: "/settings/areas",
            isAdmin: true,
        },
        {
            title: "Delegations",
            href: "/settings/delegations",
        },
        {
            title: "Projects",
            href: "/settings/projects",
            isAdmin: true,
        },
    ].filter(item => !item.isAdmin || adminStatus);

    const firstItem = sidebarItems[0];
    redirect(firstItem?.href || '/');
}
