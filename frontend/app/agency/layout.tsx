import { DashboardShell } from "@/components/shared/dashboard-shell";
export default function AgencyLayout({ children }: { children: React.ReactNode }) { return <DashboardShell role="agency" roleLabel="Agency workspace">{children}</DashboardShell>; }
