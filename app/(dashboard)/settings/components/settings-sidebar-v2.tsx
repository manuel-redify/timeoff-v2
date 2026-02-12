"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building, Users, Calendar, FileText, UserCheck, Shield, Shirt, Folder, Settings, Briefcase, Cpu, Share2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

interface SettingsNavItem {
    href: string
    title: string
    icon?: LucideIcon
    isAdmin?: boolean
}

interface SettingsSidebarV2Props extends React.HTMLAttributes<HTMLElement> {
    items: SettingsNavItem[]
}

export function SettingsSidebarV2({ className, items, ...props }: SettingsSidebarV2Props) {
    const pathname = usePathname()
    const { isMobile } = useSidebar()

    // Map icons to items
    const itemsWithIcons = items.map((item) => ({
        ...item,
        icon: getDefaultIcon(item.title)
    }))

    return (
        <Sidebar variant="sidebar" collapsible={isMobile ? "offcanvas" : "none"} className={className} {...props}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {itemsWithIcons.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}

function getDefaultIcon(title: string): LucideIcon {
    switch (title) {
        case "Company":
            return Building
        case "Departments":
            return Users
        case "Bank Holidays":
            return Calendar
        case "Leave Types":
            return Briefcase
        case "Contract Types":
            return FileText
        case "Delegations":
            return Share2
        case "Roles":
            return Shield
        case "Areas":
            return Cpu
        case "Projects":
            return Folder
        default:
            return Settings
    }
}