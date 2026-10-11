"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CalendarClock,
  CircleDollarSign,
  UserRound,
  WalletCards,
  Workflow,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { LeadStatusBadge } from "@/components/agency/leads/lead-status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import type { WorkerDashboardData } from "@/types";

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);

export function WorkerDashboard() {
  const { user } = useAuth(),
    [data, setData] =
      useState<WorkerDashboardData | null>(null),
    [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);

    apiRequest<WorkerDashboardData>(
      "/worker/dashboard",
    )
      .then((r) => setData(r.data ?? null))
      .catch(() => setError(true));
  }, []);

  useEffect(load, [load]);

  if (error)
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <b>Couldn&apos;t load your dashboard.</b>
        <br />
        <Button
          className="mt-4"
          onClick={load}
        >
          Try Again
        </Button>
      </div>
    );

  if (!data)
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );

  const hour = new Date().getHours(),
    greeting =
      hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening";

  const stats = [
    [
      "Assigned Leads",
      data.stats.assignedLeadCount,
      UserRound,
    ],
    [
      "Active Leads",
      data.stats.activeLeadCount,
      Workflow,
    ],
    [
      "Due Today",
      data.stats.todayFollowUps,
      CalendarClock,
    ],
    [
      "Pending Earnings",
      money(data.stats.pendingEarningsPaise),
      CircleDollarSign,
    ],
    [
      "Available Balance",
      money(data.stats.availableBalancePaise),
      WalletCards,
    ],
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-primary">
          {user?.agency?.name}
        </p>

        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {greeting}, {user?.name.split(" ")[0]}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Your assigned work and earnings, updated from
          live data.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-2xl border bg-white p-5 shadow-card"
          >
            <Icon className="size-5 text-primary" />

            <p className="mt-4 text-xs text-muted-foreground">
              {label}
            </p>

            <p className="text-2xl font-extrabold">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <section className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">
                Today&apos;s Work
              </h2>

              <p className="text-sm text-muted-foreground">
                Follow-ups assigned to you
              </p>
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
            >
              <Link href="/worker/followups">
                View all
              </Link>
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            {data.todayFollowUps.length ? (
              data.todayFollowUps.map((x) => (
                <div
                  key={x.id}
                  className="rounded-xl bg-muted/45 p-3"
                >
                  <b className="text-sm">
                    {x.leadId.name}
                  </b>

                  <p className="text-xs text-muted-foreground">
                    {new Date(
                      x.scheduledAt,
                    ).toLocaleTimeString("en-IN", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · {x.notes || x.title}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No follow-ups due today.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">
            Recently Updated Leads
          </h2>

          <Button
            asChild
            variant="ghost"
            size="sm"
          >
            <Link href="/worker/leads">
              My Leads
            </Link>
          </Button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.recentLeads.length ? (
            data.recentLeads.map((x) => (
              <Link
                href={`/worker/leads/${x.id}`}
                key={x.id}
                className="flex items-center justify-between rounded-xl p-3 hover:bg-muted"
              >
                <span>
                  <b className="text-sm">
                    {x.name}
                  </b>

                  <small className="block text-muted-foreground">
                    {x.phone}
                  </small>
                </span>

                <LeadStatusBadge
                  status={x.status}
                />
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No leads assigned yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}