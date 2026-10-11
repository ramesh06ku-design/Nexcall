
"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Users,
  ContactRound,
  PhoneCall,
  RefreshCw,
} from "lucide-react";

import { apiRequest } from "@/lib/api/client";
import { CallsAreaChart } from "@/components/shared/analytics-charts";

type AnalyticsData = {
  summary: {
    totalAgencies: number;
    activeAgencies: number;
    totalTelecallers: number;
    totalLeads: number;
    totalCalls: number;
  };
  callActivity: {
    date: string;
    calls: number;
  }[];
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<AnalyticsData>(
        "/admin/analytics"
      );

      if (!response.data) {
        throw new Error("Analytics data not available.");
      }

      setAnalytics(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const metrics = analytics
    ? [
        {
          title: "Total Agencies",
          value: analytics.summary.totalAgencies,
          icon: Building2,
        },
        {
          title: "Active Agencies",
          value: analytics.summary.activeAgencies,
          icon: CheckCircle2,
        },
        {
          title: "Total Telecallers",
          value: analytics.summary.totalTelecallers,
          icon: Users,
        },
        {
          title: "Total Leads",
          value: analytics.summary.totalLeads,
          icon: ContactRound,
        },
        {
          title: "Total Calls",
          value: analytics.summary.totalCalls,
          icon: PhoneCall,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">
            PLATFORM ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Platform Analytics
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Real-time platform growth and call activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAnalytics()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {loading && !analytics && (
        <p className="text-sm text-muted-foreground">
          Loading platform analytics...
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {analytics && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {metric.title}
                    </p>

                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <p className="mt-3 text-3xl font-bold">
                    {metric.value.toLocaleString("en-IN")}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">
              Call Activity
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Recorded calls during the last 7 days (UTC).
            </p>

            <div className="mt-6">
              <CallsAreaChart
                data={analytics.callActivity}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
