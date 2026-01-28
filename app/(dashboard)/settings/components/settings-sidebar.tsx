"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building, Users, Calendar, FileText, UserCheck, Settings } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SettingsSidebarProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string
        title: string
        isAdmin?: boolean
    }[]
}

export function SettingsSidebar({ className, items, ...props }: SettingsSidebarProps) {
    const pathname = usePathname()

    // Map icons to items
    const itemsWithIcons = items.map((item: any) => ({
        ...item,
        icon: getDefaultIcon(item.title)
    }))

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {itemsWithIcons.map((item: any) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        pathname === item.href
                            ? "bg-muted hover:bg-muted"
                            : "hover:bg-transparent hover:underline",
                        "justify-start gap-2"
                    )}
                >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                </Link>
            ))}
        </nav>
    )
}

function getDefaultIcon(title: string) {
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
    default:
      return Settings
  }
}