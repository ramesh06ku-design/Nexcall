"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LeadStatusBadge } from "@/components/agency/leads/lead-status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import type { Lead } from "@/types";

export default function Page() {
  const { id } = useParams<{ id: string }>(),
    [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    apiRequest<Lead>(`/worker/leads/${id}`).then((r) =>
      setLead(r.data ?? null),
    );
  }, [id]);

  if (!lead) return <Skeleton className="h-64" />;

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-card">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Assigned lead</p>
          <h1 className="text-2xl font-extrabold">{lead.name}</h1>
        </div>

        <LeadStatusBadge status={lead.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <p>
          <small className="text-muted-foreground">Phone</small>
          <br />
          <b>{lead.phone}</b>
        </p>

        <p>
          <small className="text-muted-foreground">Email</small>
          <br />
          <b>{lead.email || "Not provided"}</b>
        </p>

        <p>
          <small className="text-muted-foreground">Company</small>
          <br />
          <b>{lead.company || "Not provided"}</b>
        </p>

        <p>
  <small className="text-muted-foreground">Requirement</small>
  <br />
  <b>{lead.requirement || "Not provided"}</b>
</p>

        <p>
          <small className="text-muted-foreground">Notes</small>
          <br />
          <b>{lead.notes || "No notes"}</b>
        </p>
      </div>
    </div>
  );
}