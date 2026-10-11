
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { CreditCard, Users2, FileText, Search } from "lucide-react";

import { apiRequest } from "@/lib/api/client";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  billingInterval: "monthly" | "yearly";
  description: string;
  limits: {
    telecallers: number;
    leads: number;
  };
  isActive: boolean;
  createdAt: string;
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [search, setSearch] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    price: "",
    billingInterval: "monthly" as "monthly" | "yearly",
    description: "",
    telecallers: "",
    leads: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      try {
        const response = await apiRequest<{
          items: SubscriptionPlan[];
        }>("/admin/plans");

        if (cancelled) return;

        if (!response.data) {
          throw new Error("Plans data unavailable");
        }

        setPlans(response.data.items);
      } catch {
        if (!cancelled) {
          setError("Unable to load subscription plans.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);

  async function changePlanStatus(plan: SubscriptionPlan) {
    const nextStatus = !plan.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } "${plan.name}"?`
    );

    if (!confirmed) return;

    setUpdatingPlanId(plan.id);
    setError("");

    try {
      await apiRequest(
        `/admin/plans/${plan.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: nextStatus,
          }),
        }
      );

      setPlans((previous) =>
        previous.map((item) =>
          item.id === plan.id
            ? { ...item, isActive: nextStatus }
            : item
        )
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to update plan status."
      );
    } finally {
      setUpdatingPlanId(null);
    }
  }



  function startEditPlan(plan: SubscriptionPlan) {
    setEditingPlanId(plan.id);
    setShowCreateForm(true);
    setFormError("");

    setForm({
      name: plan.name,
      price: String(plan.price),
      billingInterval: plan.billingInterval,
      description: plan.description ?? "",
      telecallers: String(plan.limits.telecallers),
      leads: String(plan.limits.leads),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  
  async function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const price = Number(form.price);
    const telecallers = Number(form.telecallers);
    const leads = Number(form.leads);

    if (
      !form.name.trim() ||
      !form.price.trim() ||
      !form.telecallers.trim() ||
      !form.leads.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(telecallers) ||
      telecallers < 0 ||
      !Number.isInteger(leads) ||
      leads < 0
    ) {
      setFormError("Please enter valid plan details.");
      return;
    }

    setSaving(true);

    try {
      const response = await apiRequest<SubscriptionPlan>(
        editingPlanId
          ? `/admin/plans/${editingPlanId}`
          : "/admin/plans",
        {
          method: editingPlanId ? "PATCH" : "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            price,
            billingInterval: form.billingInterval,
            description: form.description.trim(),
            limits: { telecallers, leads },
          }),
        }
      );

      if (!response.data) {
        throw new Error("Plan creation failed");
      }

      const savedPlan = response.data;

setPlans((previous) =>
  editingPlanId
    ? previous.map((plan) =>
        plan.id === editingPlanId ? savedPlan : plan
      )
    : [savedPlan, ...previous]
);

setEditingPlanId(null);
      setSearch("");
      setShowCreateForm(false);
      setForm({
        name: "",
        price: "",
        billingInterval: "monthly",
        description: "",
        telecallers: "",
        leads: "",
      });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to create plan."
      );
    } finally {
      setSaving(false);
    }
  }


  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <>
      <PageHeading
        eyebrow="Management"
        title="Subscription Plans"
        description="Manage NexCall platform subscription plans."
      />

      
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setShowCreateForm((previous) => !previous);
setEditingPlanId(null);
setFormError("");
setForm({
  name: "",
  price: "",
  billingInterval: "monthly",
  description: "",
  telecallers: "",
  leads: "",
});
          }}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {showCreateForm ? "Cancel" : "+ Create Plan"}
        </button>
      </div>

      {showCreateForm && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>
  {editingPlanId ? "Edit Subscription Plan" : "Create Subscription Plan"}
</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span>Plan Name</span>
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full rounded-lg border bg-background p-2.5"
                    placeholder="e.g. Growth"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Price (₹)</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full rounded-lg border bg-background p-2.5"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Billing Interval</span>
                  <select
                    value={form.billingInterval}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        billingInterval: e.target.value as
                          | "monthly"
                          | "yearly",
                      })
                    }
                    className="w-full rounded-lg border bg-background p-2.5"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  <span>Telecaller Limit</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.telecallers}
                    onChange={(e) =>
                      setForm({ ...form, telecallers: e.target.value })
                    }
                    className="w-full rounded-lg border bg-background p-2.5"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span>Lead Limit</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.leads}
                    onChange={(e) =>
                      setForm({ ...form, leads: e.target.value })
                    }
                    className="w-full rounded-lg border bg-background p-2.5"
                  />
                </label>
              </div>

              <label className="block space-y-1 text-sm">
                <span>Description</span>
                <textarea
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="min-h-24 w-full rounded-lg border bg-background p-2.5"
                  placeholder="Describe this plan..."
                />
              </label>

              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saving
  ? editingPlanId
    ? "Saving..."
    : "Creating..."
  : editingPlanId
    ? "Save Changes"
    : "Create Subscription Plan"}
              </button>
            </form>
          </CardContent>
        </Card>
      )}


      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CreditCard className="size-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">
                Total Plans
              </p>
              <p className="text-2xl font-bold">
                {loading ? "..." : error ? "—" : plans.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CreditCard className="size-6 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">
                Active Plans
              </p>
              <p className="text-2xl font-bold">
                {loading
                  ? "..."
                  : error
                    ? "—"
                    : plans.filter((plan) => plan.isActive).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>All Subscription Plans</CardTitle>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search plans..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading subscription plans...
            </p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-500">
              {error}
            </p>
          ) : filteredPlans.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {search
                ? "No matching plans found."
                : "No subscription plans created yet."}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-border p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">
                      {plan.name}
                    </h3>

                    <Badge variant="neutral">
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <p className="mt-3 text-2xl font-bold">
                    ₹{plan.price.toLocaleString("en-IN")}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      / {plan.billingInterval}
                    </span>
                  </p>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {plan.description}
                  </p>

                  <button
  type="button"
  onClick={() => startEditPlan(plan)}
  className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
>
  Edit Plan
</button>


<button
  type="button"
  disabled={updatingPlanId === plan.id}
  onClick={() => changePlanStatus(plan)}
  className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
    plan.isActive
      ? "border-red-500/30 text-red-600 hover:bg-red-500/10"
      : "border-green-500/30 text-green-600 hover:bg-green-500/10"
  }`}
>
  {updatingPlanId === plan.id
    ? "Updating..."
    : plan.isActive
      ? "Deactivate Plan"
      : "Activate Plan"}
</button>


                  <div className="mt-5 space-y-3 border-t border-border pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Users2 className="size-4" />
                        Telecallers
                      </span>
                      <span className="font-semibold">
                        {plan.limits.telecallers.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="size-4" />
                        Leads
                      </span>
                      <span className="font-semibold">
                        {plan.limits.leads.toLocaleString("en-IN")}
                      </span>
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
