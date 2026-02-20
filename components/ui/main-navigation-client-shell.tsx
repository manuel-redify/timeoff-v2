"use client";

import { useEffect, useState } from "react";
import { MainNavigation } from "@/components/ui/MainNavigation";
import { MainNavigationSkeleton } from "@/components/ui/main-navigation-skeleton";

interface UserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  image?: string | null;
}

interface MainNavigationClientShellProps {
  isAdmin: boolean;
  isSupervisor: boolean;
  user?: UserData;
  pendingApprovalsCount?: number;
}

export function MainNavigationClientShell(props: MainNavigationClientShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <MainNavigationSkeleton />;
  }

  return <MainNavigation {...props} />;
}
