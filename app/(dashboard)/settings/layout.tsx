import { Metadata } from "next"

import { Separator } from "@/components/ui/separator"
import { SettingsSidebar } from "./components/settings-sidebar"
import { isAdmin, isAnySupervisor } from "@/lib/rbac"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Settings",
    description: "Manage company settings and preferences.",
}

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
    const adminStatus = await isAdmin()
    const supervisorStatus = await isAnySupervisor()

    if (!adminStatus && !supervisorStatus) {
        redirect("/")
    }

    const sidebarNavItems = [
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
            title: "Delegations",
            href: "/settings/delegations",
        },
    ].filter(item => !item.isAdmin || adminStatus)

    return (
        <div className="space-y-6 p-10 pb-16 md:block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your company settings and organizational preferences.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <SettingsSidebar items={sidebarNavItems} />
                </aside>
                <div className="flex-1 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    )
}
