import { WorkerPresence } from "@/components/worker/worker-presence";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell role="worker" roleLabel="Telecaller workspace">
      <WorkerPresence />
      {children}
    </DashboardShell>
  );
}