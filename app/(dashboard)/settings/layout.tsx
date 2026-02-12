import { Metadata } from "next"

import { Separator } from "@/components/ui/separator"
import { SettingsSidebarV2 } from "./components/settings-sidebar-v2"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
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
        {
            title: "Workflows",
            href: "/settings/workflows",
            isAdmin: true,
        },
    ].filter(item => !item.isAdmin || adminStatus)

    return (

        <SidebarProvider>
            <SettingsSidebarV2 items={sidebarNavItems} className="" />
            <SidebarInset className="pt-16">
                <SidebarTrigger className="-ml-1 md:hidden" />
                {/*<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <div className="flex-1">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                            <p className="text-muted-foreground">
                                Manage your company settings and organizational preferences.
                            </p>
                        </div>
                    </div>
                </header>*/}
                <main className="flex-1 space-y-6 p-6">
                    <Separator className="my-6" />
                    <div className="w-full">{children}</div>
                </main>
            </SidebarInset>
        </SidebarProvider>

    )
}
