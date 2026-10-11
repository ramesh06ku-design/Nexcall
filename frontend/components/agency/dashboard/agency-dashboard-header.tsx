"use client";

import { useAuth } from "@/components/auth/auth-provider";

export function AgencyDashboardHeader() {
  const { user } = useAuth();
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-primary">Agency overview</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Here&apos;s what&apos;s happening with {user?.agency?.name ?? "your team"} today.
      </p>
    </div>
  );
}
