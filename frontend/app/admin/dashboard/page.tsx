"use client";

import { useEffect, useState } from "react";
import { Building2, CircleCheck, Users2 } from "lucide-react";

import { CallsAreaChart } from "@/components/shared/analytics-charts";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest } from "@/lib/api/client";

type DashboardData = {
  stats: {
    totalAgencies: number;
    activeAgencies: number;
    totalTelecallers: number;
  };
  callActivity: {
    date: string;
    calls: number;
  }[];
  latestAgencies: {
    id: string;
    name: string;
    status: "active" | "suspended";
    createdAt: string;
  }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAgencies: 0,
    activeAgencies: 0,
    totalTelecallers: 0,
  });

  const [callActivity, setCallActivity] = useState<
    DashboardData["callActivity"]
  >([]);

  const [latestAgencies, setLatestAgencies] = useState<
    DashboardData["latestAgencies"]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await apiRequest<DashboardData>(
          "/admin/dashboard"
        );

        if (cancelled) return;

        if (!response.data) {
          throw new Error("Dashboard data unavailable");
        }

        setStats(response.data.stats);
        setCallActivity(response.data.callActivity ?? []);
        setLatestAgencies(response.data.latestAgencies ?? []);
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const metricValue = (value: number) => {
    if (error) return "—";
    if (loading) return "...";
    return value.toLocaleString("en-IN");
  };

  return (
    <>
      <PageHeading
        eyebrow="Overview"
        title="Platform at a glance"
        description="Real-time overview of agencies, telecallers and platform activity."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <MetricCard
          label="Total agencies"
          value={metricValue(stats.totalAgencies)}
          icon={Building2}
        />

        <MetricCard
          label="Active agencies"
          value={metricValue(stats.activeAgencies)}
          icon={CircleCheck}
        />

        <MetricCard
          label="Total telecallers"
          value={metricValue(stats.totalTelecallers)}
          icon={Users2}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Platform call activity</CardTitle>
                <CardDescription>
                  Actual call records from the last 7 days
                </CardDescription>
              </div>

              <Badge variant="neutral">Last 7 days</Badge>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Loading call activity...
              </p>
            ) : error ? (
              <p className="py-12 text-center text-sm text-red-500">
                Unable to load call activity.
              </p>
            ) : (
              <CallsAreaChart data={callActivity} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently registered agencies</CardTitle>
            <CardDescription>
              Latest agencies added to the platform
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading agencies...
              </p>
            ) : error ? (
              <p className="text-sm text-red-500">
                Unable to load agencies.
              </p>
            ) : latestAgencies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No agencies registered yet.
              </p>
            ) : (
              latestAgencies.map((agency) => (
                <div
                  key={agency.id}
                  className="flex items-start gap-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                    {agency.name.slice(0, 2).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {agency.name}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Registered{" "}
                      {new Date(
                        agency.createdAt
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <Badge variant="neutral">
                    {agency.status === "active"
                      ? "Active"
                      : "Suspended"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}