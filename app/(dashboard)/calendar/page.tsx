import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import CalendarContent from "./calendar-content";
import { PageLoadingSkeleton } from "@/components/auth/loading-skeletons";

export const metadata = {
  title: "Calendar | TimeOff Management",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function CalendarPage() {
    // Server-side authentication check
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    return (
        <Suspense fallback={<PageLoadingSkeleton message="Loading calendar..." />}>
            <CalendarContent />
        </Suspense>
    );
}
