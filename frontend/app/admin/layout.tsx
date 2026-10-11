import { DashboardShell } from "@/components/shared/dashboard-shell";
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <DashboardShell role="admin" roleLabel="Platform admin">{children}</DashboardShell>; }
