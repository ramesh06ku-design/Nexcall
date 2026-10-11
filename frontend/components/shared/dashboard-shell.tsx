"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Bell, ChevronDown, Menu, PhoneCall, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingState } from "@/components/shared/states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/ui/sidebar";
import { useDisclosure } from "@/hooks/use-disclosure";
import { dashboardForRole } from "@/lib/auth/routes";
import { adminNavigation, agencyNavigation, workerNavigation } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  role: "admin" | "agency" | "worker";
  roleLabel: string;
}

export function DashboardShell({ children, role, roleLabel }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { isOpen, open, close } = useDisclosure();
  const expectedRole: UserRole = role === "worker" ? "telecaller" : role;
  const navigation =
    role === "admin" ? adminNavigation : role === "agency" ? agencyNavigation : workerNavigation;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(expectedRole === "telecaller" ? "/worker-login" : "/login");
      return;
    }
    if (user.role !== expectedRole) router.replace(dashboardForRole[user.role]);
  }, [expectedRole, isLoading, router, user]);

  async function signOut() {
    try {
      await logout();
      router.replace(expectedRole === "telecaller" ? "/worker-login" : "/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign out");
    }
  }

  if (isLoading || !user || user.role !== expectedRole) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <LoadingState label="Verifying workspace access…" />
      </main>
    );
  }

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2);

  const sidebar = (
    <>
      <div className="flex h-18 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-white">
          <span className="grid size-9 place-items-center rounded-xl bg-primary">
            <PhoneCall className="size-4" />
          </span>
          NEXCALL
        </Link>
        <button
          className="rounded-lg p-2 text-slate-400 lg:hidden"
          onClick={close}
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={close}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>
      {role !== "worker" && <div className="m-3 rounded-2xl bg-white/5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
          Authentication active
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Your workspace is protected by server-verified role access.
        </p>
      </div>}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Sidebar className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:flex">{sidebar}</Sidebar>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/45"
            onClick={close}
            aria-label="Close navigation overlay"
          />
          <Sidebar className="relative h-full w-[82%] max-w-72 shadow-xl">{sidebar}</Sidebar>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b bg-white/90 px-4 backdrop-blur-lg sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={open}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {roleLabel}
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {user.agency?.name ?? "NexCall workspace"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role !== "worker" && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                  <Bell className="size-5" />
                  <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-2">
                <div className="px-2 py-2">
                  <p className="text-sm font-bold">Notifications</p>
                  <p className="text-xs text-muted-foreground">Today&apos;s workspace updates</p>
                </div>
                {["Your workspace is up to date."].map((notification) => (
                  <DropdownMenuItem key={notification} className="items-start gap-3 py-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    <span className="text-sm">{notification}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl p-1.5 text-left hover:bg-muted">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block">
                  <b className="block max-w-32 truncate text-xs">{user.name}</b>
                  <span className="block max-w-32 truncate text-[10px] text-muted-foreground">
                    {user.email}
                  </span>
                </span>
                <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="border-b px-3 py-3">
                  <p className="truncate text-sm font-bold">{user.agency?.name ?? "NexCall"}</p>
                  <p className="mt-1 truncate text-xs font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                {role === "worker" ? <DropdownMenuItem asChild className="mt-1"><Link href="/worker/profile">Profile</Link></DropdownMenuItem> : <DropdownMenuItem asChild className="mt-1"><Link href={`/${role}/settings`}>Settings</Link></DropdownMenuItem>}
                <DropdownMenuItem className="text-red-600" onSelect={() => void signOut()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
