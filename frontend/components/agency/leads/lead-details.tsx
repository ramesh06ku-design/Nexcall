"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { CallOutcomeBadge } from "@/components/agency/calls/call-outcome-badge";
import { duration } from "@/components/agency/calls/call-manager";
import { LeadStatusBadge } from "./lead-status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import type { CallLog, Lead } from "@/types";

const when = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function LeadDetails({ id }: { id: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      apiRequest<Lead>(`/agency/leads/${id}`),
      apiRequest<CallLog[]>(`/agency/leads/${id}/calls`),
    ])
      .then(([leadResponse, callResponse]) => {
        setLead(leadResponse.data ?? null);
        setCalls(callResponse.data ?? []);
      })
      .catch(() => setError(true));
  }, [id]);

  if (error)
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <b>Lead not found</b>
        <br />
        <Button asChild className="mt-4" variant="outline">
          <Link href="/agency/leads">Back to Leads</Link>
        </Button>
      </div>
    );

  if (!lead)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-52" />
        <Skeleton className="h-72" />
      </div>
    );

  const details = [
    {
      label: "Phone",
      value: lead.phone,
      icon: Phone,
    },
    {
      label: "Email",
      value: lead.email || "Not provided",
      icon: Mail,
    },
    {
      label: "Company",
      value: lead.company || "Not provided",
      icon: Building2,
    },
    {
      label: "Source",
      value: lead.source || "Not provided",
      icon: UserRound,
    },
    {
      label: "Assigned telecaller",
      value: lead.assignedTo?.name || "Unassigned",
      icon: UserRound,
    },
    {
      label: "Created",
      value: when(lead.createdAt),
      icon: CalendarDays,
    },
    {
      label: "Updated",
      value: when(lead.updatedAt),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost">
        <Link href="/agency/leads">
          <ArrowLeft className="size-4" /> Leads
        </Link>
      </Button>

      <section className="rounded-2xl border bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Lead information
            </p>

            <h1 className="mt-1 text-2xl font-extrabold">
              {lead.name}
            </h1>
          </div>

          <LeadStatusBadge status={lead.status} />
        </div>

        <dl className="mt-6 grid gap-5 border-t pt-6 sm:grid-cols-2 xl:grid-cols-3">
          {details.map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">
                {label}
              </dt>

              <dd className="mt-1 flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4 text-primary" />
                {value}
              </dd>
            </div>
          ))}
                </dl>

        {lead.requirement && (
          <div className="mt-6 rounded-xl border bg-primary-soft/30 p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">
              Requirement
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm font-medium">
              {lead.requirement}
            </p>
          </div>
        )}

        {lead.notes && (
          <div className="mt-4 rounded-xl bg-muted/55 p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm">
              {lead.notes}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="font-bold">Call History</h2>

        <p className="text-sm text-muted-foreground">
          Newest conversations first
        </p>

        {calls.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">
            No calls logged for this lead.
          </p>
        ) : (
          <div className="mt-4 divide-y">
            {calls.map((call) => (
              <Link
                key={call.id}
                href={`/agency/calls/${call.id}`}
                className="flex flex-col gap-2 py-3 hover:text-primary sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <b className="text-sm">
                    {when(call.startedAt)}
                  </b>

                  <p className="text-xs text-muted-foreground">
                    {call.telecallerId.name} ·{" "}
                    {duration(call.durationSeconds)}
                  </p>
                </div>

                <CallOutcomeBadge outcome={call.outcome} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-6">
        <h2 className="font-bold">Activity</h2>

        <div className="mt-4 flex gap-3">
          <span className="mt-1.5 size-2 rounded-full bg-primary ring-4 ring-primary-soft" />

          <div>
            <p className="text-sm font-semibold">
              Lead created
            </p>

            <p className="text-xs text-muted-foreground">
              {when(lead.createdAt)}
            </p>
          </div>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          Follow-up activity will appear here in a future phase.
        </p>
      </section>
    </div>
  );
}