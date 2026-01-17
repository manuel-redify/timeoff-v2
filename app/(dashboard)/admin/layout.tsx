import { isAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const adminStatus = await isAdmin();
    if (!adminStatus) {
        redirect("/");
    }

    return <>{children}</>;
}
