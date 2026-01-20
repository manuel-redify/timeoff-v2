import { Metadata } from "next"
import Image from "next/image"

import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "./components/sidebar-nav"
import { isAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Settings",
    description: "Manage company settings and preferences.",
}

const sidebarNavItems = [
    {
        title: "Company",
        href: "/settings/company",
    },
    {
        title: "Departments",
        href: "/settings/departments",
    },
    {
        title: "Bank Holidays",
        href: "/settings/holidays",
    },
    // {
    //   title: "Schedule",
    //   href: "/settings/schedule",
    // },
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
    const adminStatus = await isAdmin()
    if (!adminStatus) {
        redirect("/")
    }

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
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="flex-1 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    )
}
