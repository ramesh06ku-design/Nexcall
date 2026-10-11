
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Users2,
  CalendarDays,
} from "lucide-react";

import { apiRequest } from "@/lib/api/client";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Telecaller = {
  id: string;
  name: string;
  email: string;
  status: string;
  lastSeenAt: string | null;
  createdAt: string;
};

type AvailablePlan = {
  id: string;
  name: string;
  price: number;
  billingInterval: "monthly" | "yearly";
  isActive: boolean;
};

type AgencyDetails = {
  id: string;
  name: string;
  status: "active" | "suspended";
  owner: {
    id: string;
    name: string;
    email: string;
    status: string;
  } | null;
  plan: {
    id: string;
    name: string;
    price: number;
    billingInterval: "monthly" | "yearly";
  } | null;
  telecallerCount: number;
  createdAt: string;
  telecallers: Telecaller[];
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminAgencyDetailsPage() {
  const params = useParams<{ id: string }>();
  const agencyId = params.id;

  const [agency, setAgency] = useState<AgencyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

    const [plans, setPlans] = useState<AvailablePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState("");
  const [planSuccess, setPlanSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAgency() {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest<AgencyDetails>(
          `/admin/agencies/${agencyId}`
        );

        if (cancelled) return;

        if (!response.data) {
          throw new Error("Agency details unavailable");
        }

        setAgency(response.data);
                setSelectedPlanId(response.data.plan?.id ?? "");
      } catch {
        if (!cancelled) {
          setError("Unable to load agency details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (agencyId) {
      void loadAgency();
    }

    return () => {
      cancelled = true;
    };
  }, [agencyId]);
  
  
  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      try {
        const response = await apiRequest<{
          items: AvailablePlan[];
        }>("/admin/plans");

        if (!cancelled) {
          setPlans(response.data?.items ?? []);
        }
      } catch {
        if (!cancelled) {
          setPlanError("Unable to load available plans.");
        }
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveAgencyPlan() {
    if (!agency || savingPlan) return;

    setSavingPlan(true);
    setPlanError("");
    setPlanSuccess("");

    try {
      await apiRequest(
        `/admin/agencies/${agencyId}/plan`,
        {
          method: "PATCH",
          body: JSON.stringify({
            planId: selectedPlanId || null,
          }),
        }
      );

      const response = await apiRequest<AgencyDetails>(
        `/admin/agencies/${agencyId}`
      );

      if (!response.data) {
        throw new Error("Unable to refresh agency details.");
      }

      setAgency(response.data);
      setSelectedPlanId(response.data.plan?.id ?? "");
      setPlanSuccess("Subscription plan updated successfully.");
    } catch (err) {
      setPlanError(
        err instanceof Error
          ? err.message
          : "Unable to update subscription plan."
      );
    } finally {
      setSavingPlan(false);
    }
  }

  return (
    <>
      <Link
        href="/admin/agencies"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Agencies
      </Link>

      <PageHeading
        eyebrow="Agency Management"
        title={agency?.name ?? "Agency Details"}
        description="View agency information, subscription and telecallers."
      />

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Loading agency details...
          </CardContent>
        </Card>
      ) : error || !agency ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-red-500">
            {error || "Agency not found."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <Building2 className="size-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Agency Status
                  </p>
                  <Badge variant="neutral">
                    {agency.status === "active"
                      ? "Active"
                      : "Suspended"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <Users2 className="size-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Total Telecallers
                  </p>
                  <p className="text-2xl font-bold">
                    {agency.telecallerCount}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <CalendarDays className="size-6 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Registered
                  </p>
                  <p className="text-sm font-semibold">
                    {formatDate(agency.createdAt)}
                  </p>
                </div>

                
                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  <label
                    htmlFor="agency-plan"
                    className="block text-sm font-medium"
                  >
                    Assign / Change Subscription Plan
                  </label>

                  <select
                    id="agency-plan"
                    value={selectedPlanId}
                    onChange={(event) => {
                      setSelectedPlanId(event.target.value);
                      setPlanError("");
                      setPlanSuccess("");
                    }}
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-sm"
                  >
                    <option value="">No Plan (Unassign)</option>

                    {plans
                      .filter(
                        (plan) =>
                          plan.isActive ||
                          plan.id === agency.plan?.id
                      )
                      .map((plan) => (
                        <option
                          key={plan.id}
                          value={plan.id}
                          disabled={!plan.isActive}
                        >
                          {plan.name} — ₹
                          {plan.price.toLocaleString("en-IN")}
                          /{plan.billingInterval}
                          {!plan.isActive ? " (Inactive)" : ""}
                        </option>
                      ))}
                  </select>

                  {planError && (
                    <p className="text-sm text-red-500">
                      {planError}
                    </p>
                  )}

                  {planSuccess && (
                    <p className="text-sm text-green-600">
                      {planSuccess}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => void saveAgencyPlan()}
                    disabled={
                      savingPlan ||
                      selectedPlanId === (agency.plan?.id ?? "")
                    }
                    className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {savingPlan ? "Saving..." : "Save Plan"}
                  </button>
                </div>

              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agency Owner</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Owner Name
                  </p>
                  <p className="font-semibold">
                    {agency.owner?.name ?? "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Email
                  </p>
                  <p className="flex items-center gap-2 break-all text-sm">
                    <Mail className="size-4 shrink-0" />
                    {agency.owner?.email ?? "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Account Status
                  </p>
                  <p className="text-sm font-medium capitalize">
                    {agency.owner?.status ?? "Unknown"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Plan</CardTitle>
              </CardHeader>

              <CardContent>
                {agency.plan ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Plan Name
                      </p>
                      <p className="font-semibold">
                        {agency.plan.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Listed Price
                      </p>
                      <p className="text-lg font-bold">
                        ₹{agency.plan.price.toLocaleString("en-IN")}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          / {agency.plan.billingInterval}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No subscription plan assigned.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Telecallers ({agency.telecallers.length})
              </CardTitle>
            </CardHeader>

            <CardContent>
              {agency.telecallers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No telecallers found for this agency.
                </p>
              ) : (
                <div className="space-y-3">
                  {agency.telecallers.map((worker) => (
                    <div
                      key={worker.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {worker.name}
                          </p>
                          <p className="break-all text-sm text-muted-foreground">
                            {worker.email}
                          </p>
                        </div>

                        <Badge variant="neutral">
                          {worker.status === "active"
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </div>

                      <div className="mt-3 grid gap-3 border-t border-border pt-3 text-xs text-muted-foreground sm:grid-cols-2">
                        <div>
                          <p>Last Seen</p>
                          <p className="mt-1 font-medium text-foreground">
                            {formatDate(worker.lastSeenAt)}
                          </p>
                        </div>

                        <div>
                          <p>Joined</p>
                          <p className="mt-1 font-medium text-foreground">
                            {formatDate(worker.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
