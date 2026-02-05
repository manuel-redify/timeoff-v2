"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building, Users, Calendar, FileText, UserCheck, Shield, Shirt, Folder, Settings } from "lucide-react"
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

    // Map icons to items
    const itemsWithIcons = items.map((item) => ({
        ...item,
        icon: getDefaultIcon(item.title)
    }))

    return (
        <Sidebar collapsible="none" className={className} {...props}>
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
            return FileText
        case "Delegations":
            return UserCheck
        case "Roles":
            return Shield
        case "Areas":
            return Shirt
        case "Projects":
            return Folder
        default:
            return Settings
    }
}