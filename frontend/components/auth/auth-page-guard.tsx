"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/shared/states";
import { useAuth } from "@/components/auth/auth-provider";
import { dashboardForRole } from "@/lib/auth/routes";

export function AuthPageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user) router.replace(dashboardForRole[user.role]);
  }, [router, user]);

  if (isLoading || user) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <LoadingState label={user ? "Opening your workspace…" : "Checking your session…"} />
      </main>
    );
  }
  return children;
}
