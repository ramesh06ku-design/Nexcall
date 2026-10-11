
"use client";

import { useEffect, useState } from "react";
import { Building2, Search, Users2 } from "lucide-react";

import { apiRequest } from "@/lib/api/client";
import { PageHeading } from "@/components/shared/page-heading";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AgencyItem = {
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
};

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<AgencyItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingAgencyId, setUpdatingAgencyId] = useState<string | null>(null);
const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAgencies() {
      try {
        const response = await apiRequest<{
          items: AgencyItem[];
        }>("/admin/agencies");

        if (cancelled) return;

        if (!response.data) {
          throw new Error("Agencies data unavailable");
        }

        setAgencies(response.data.items);
      } catch {
        if (!cancelled) {
          setError("Unable to load agencies.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAgencies();

    return () => {
      cancelled = true;
    };
  }, []);

    async function changeAgencyStatus(agency: AgencyItem) {
    const newStatus =
      agency.status === "active" ? "suspended" : "active";

    const confirmed = window.confirm(
      newStatus === "suspended"
        ? `Suspend ${agency.name}? Its owner and telecallers will lose API access until reactivated.`
        : `Activate ${agency.name}? Its owner and telecallers will regain access, provided their accounts are active.`
    );

    if (!confirmed) return;

    setUpdatingAgencyId(agency.id);
    setActionError("");

    try {
      const response = await apiRequest<{
        id: string;
        name: string;
        status: "active" | "suspended";
      }>(`/admin/agencies/${agency.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.data) {
        throw new Error("Status update failed");
      }

      setAgencies((current) =>
        current.map((item) =>
          item.id === agency.id
            ? { ...item, status: response.data!.status }
            : item
        )
      );
    } catch {
      setActionError(`Unable to update ${agency.name}. Please try again.`);
    } finally {
      setUpdatingAgencyId(null);
    }
  }

  const filteredAgencies = agencies.filter((agency) => {
    const query = search.toLowerCase().trim();

    return (
      agency.name.toLowerCase().includes(query) ||
      (agency.owner?.name ?? "").toLowerCase().includes(query) ||
      (agency.owner?.email ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <>
      <PageHeading
        eyebrow="Management"
        title="Agencies"
        description="Manage NexCall agencies and their platform status."
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="size-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">
                Total agencies
              </p>
              <p className="text-2xl font-bold">
                {loading ? "..." : error ? "—" : agencies.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users2 className="size-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">
                Active agencies
              </p>
              <p className="text-2xl font-bold">
                {loading
                  ? "..."
                  : error
                    ? "—"
                    : agencies.filter((a) => a.status === "active").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>All Agencies</CardTitle>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search agency, owner or email..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardHeader>

       <CardContent>
  {actionError && (
    <p role="alert" className="mb-4 text-sm text-red-500">
      {actionError}
    </p>
  )}

  {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading agencies...
            </p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-500">
              {error}
            </p>
          ) : filteredAgencies.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search ? "No matching agencies found." : "No agencies found."}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAgencies.map((agency) => (
                <div
                  key={agency.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold">
                        {agency.name}
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Owner: {agency.owner?.name ?? "Unknown"}
                      </p>

                      <p className="break-all text-xs text-muted-foreground">
                        {agency.owner?.email ?? "No owner email"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
  <Badge variant="neutral">
    {agency.status === "active" ? "Active" : "Suspended"}
  </Badge>

  <Link
    href={`/admin/agencies/${agency.id}`}
    className="rounded-lg border border-border px-3 py-1.5 text-center text-xs font-semibold text-foreground transition hover:bg-muted"
  >
    View Details
  </Link>
  <button
    type="button"
    disabled={updatingAgencyId !== null}
    onClick={() => void changeAgencyStatus(agency)}
    className={
      agency.status === "active"
        ? "rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        : "rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
    }
  >
    {updatingAgencyId === agency.id
      ? "Updating..."
      : agency.status === "active"
        ? "Suspend"
        : "Activate"}
  </button>
</div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Subscription plan
                      </p>
                      <p className="mt-1 font-medium">
                        {agency.plan?.name ?? "No plan"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Telecallers
                      </p>
                      <p className="mt-1 font-medium">
                        {agency.telecallerCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Registered
                      </p>
                      <p className="mt-1 font-medium">
                        {new Date(agency.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
