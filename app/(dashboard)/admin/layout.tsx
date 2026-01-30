import { isAdmin } from "@/lib/rbac"
import { redirect } from "next/navigation"
import { authRedirects } from "@/lib/auth-redirects"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    try {
        const adminStatus = await isAdmin();
        if (!adminStatus) {
            // Log the unauthorized access attempt for security
            console.warn('Unauthorized admin access attempt detected');
            return authRedirects.toAccessDenied();
        }

        return <>{children}</>;
    } catch (error) {
        console.error('Error in admin layout:', error);
        return authRedirects.toLogin();
    }
}
