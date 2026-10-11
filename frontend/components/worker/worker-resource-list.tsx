"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import { useWorkerLeadProjects } from "@/hooks/use-worker-lead-projects";
import type { FollowUp, Lead } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Kind = "leads" | "follow-ups";

type Data = {
  items: Array<Lead | FollowUp>;
  total: number;
};

export function WorkerResourceList({
  kind,
  projectId,
}: {
  kind: Kind;
  projectId?: string;
}) {
  const {
    data: projectData,
    loading: projectsLoading,
    error: projectsError,
  } = useWorkerLeadProjects();

  const [data, setData] = useState<Data | null>(null),
    [view, setView] = useState("today"),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [followUpLead, setFollowUpLead] = useState<Lead | null>(null),
[followUpLeadStatus, setFollowUpLeadStatus] =
  useState<"interested" | "follow_up">("follow_up"),
[followUpDateTime, setFollowUpDateTime] = useState(""),
    [followUpNotes, setFollowUpNotes] = useState(""),
    [savingFollowUp, setSavingFollowUp] = useState(false);

  const load = useCallback(() => {
    const p = new URLSearchParams();

    if (kind === "follow-ups") p.set("view", view);

    if (kind === "leads") {
  if (search) p.set("search", search);
  if (status !== "all") p.set("status", status);
  if (projectId) p.set("projectId", projectId);
}

    return apiRequest<Data>(`/worker/${kind}?${p}`).then((r) =>
      setData(r.data ?? null),
    );
  }, [kind, projectId, search, status, view]);

  useEffect(() => {
    void load();
  }, [load]);

  async function complete(id: string) {
    try {
      await apiRequest(`/worker/follow-ups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "complete",
        }),
      });

      toast.success("Follow-up completed.");
      await load();
    } catch (x) {
      toast.error(
        x instanceof Error
          ? x.message
          : "Unable to complete follow-up",
      );
    }
  }

  async function cancelFollowUp(id: string) {
  try {
    await apiRequest(`/worker/follow-ups/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        action: "cancel",
      }),
    });

    toast.success("Follow-up cancelled.");
    await load();
  } catch (x) {
    toast.error(
      x instanceof Error
        ? x.message
        : "Unable to cancel follow-up",
    );
  }
}

  async function updateLeadStatus(
  id: string,
  nextStatus: Lead["status"],
) {
  try {
    await apiRequest(`/worker/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: nextStatus,
      }),
    });

    toast.success("Lead status updated.");
    await load();
  } catch (x) {
    toast.error(
      x instanceof Error
        ? x.message
        : "Unable to update lead status",
    );
  }
}

async function scheduleFollowUp() {
  if (!followUpLead || !followUpDateTime) return;

  setSavingFollowUp(true);

  try {
    await apiRequest("/worker/follow-ups", {
      method: "POST",
      body: JSON.stringify({
  leadId: followUpLead.id,
  scheduledAt: new Date(
    followUpDateTime,
  ).toISOString(),
  leadStatus: followUpLeadStatus,
  ...(followUpNotes.trim()
    ? { notes: followUpNotes.trim() }
    : {}),
}),
    });

    toast.success("Follow-up scheduled successfully.");

    setFollowUpLead(null);
    setFollowUpDateTime("");
    setFollowUpNotes("");

    await load();
  } catch (x) {
    toast.error(
      x instanceof Error
        ? x.message
        : "Unable to schedule follow-up",
    );
  } finally {
    setSavingFollowUp(false);
  }
}

  if (kind === "leads" && !projectId) {
  if (projectsLoading)
      return (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      );

    return (
      <div className="space-y-5">
              {kind === "leads" && projectId && (
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href="/worker/leads">
              ← Back to Projects
            </Link>
          </Button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          My Leads
        </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Lead projects assigned to your account.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold">Lead Projects</h2>
        </div>

        {projectsError ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-muted-foreground">
            {projectsError}
          </div>
        ) : projectData?.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-muted-foreground">
            No lead projects assigned to you.
          </div>
        ) : (
          <div className="space-y-3">
            {projectData?.items.map((project) => (
  <Link
    key={project.id}
    href={`/worker/leads/projects/${project.id}`}
    className="flex items-center justify-between gap-4 rounded-2xl border bg-white p-4 shadow-card transition hover:border-primary/40 hover:shadow-md"
  >
    <span>
      <b>{project.name}</b>

      <small className="block text-muted-foreground">
        {project.leadCount}{" "}
        {project.leadCount === 1 ? "lead" : "leads"}
      </small>
    </span>

    <span className="inline-flex h-9 items-center rounded-xl border px-4 text-sm font-medium">
      Open
    </span>
  </Link>
))}
          </div>
        )}
      </div>
    );
  }

  if (!data)
    return (
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );

  const title = kind === "leads" ? "My Leads" : "My Follow-ups";

  return (
    <div className="space-y-5">
      <Dialog
  open={followUpLead !== null}
  onOpenChange={(open) => {
    if (!open && !savingFollowUp) {
      setFollowUpLead(null);
      setFollowUpDateTime("");
      setFollowUpNotes("");
    }
  }}
>
  <DialogContent className="sm:max-w-lg">
    <DialogTitle>Schedule Follow-up</DialogTitle>

    <DialogDescription>
      Choose when you want to follow up with this lead.
    </DialogDescription>

    {followUpLead && (
      <div className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="font-semibold">{followUpLead.name}</p>

          <p className="text-sm text-muted-foreground">
            {followUpLead.phone}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Follow-up date & time
          </label>

          <input
            type="datetime-local"
            className="h-11 w-full rounded-xl border px-3 text-sm"
            value={followUpDateTime}
            onChange={(e) =>
              setFollowUpDateTime(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Notes
          </label>

          <textarea
            className="min-h-24 w-full rounded-xl border p-3 text-sm"
            placeholder="Example: Client asked to call tomorrow..."
            value={followUpNotes}
            onChange={(e) => setFollowUpNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={savingFollowUp}
            onClick={() => {
              setFollowUpLead(null);
              setFollowUpDateTime("");
              setFollowUpNotes("");
            }}
          >
            Cancel
          </Button>

          <Button
  type="button"
  disabled={
    savingFollowUp ||
    !followUpDateTime
  }
  onClick={() => void scheduleFollowUp()}
>
  {savingFollowUp
    ? "Scheduling..."
    : "Schedule Follow-up"}
</Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          {title}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {kind === "leads"
            ? "Leads assigned to your authenticated account."
            : "Your upcoming, due, overdue and completed work."}
        </p>
      </div>

      {kind === "leads" ? (
        <div className="grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[1fr_180px]">
          <input
            className="h-11 rounded-xl border px-3 text-sm"
            placeholder="Search name, phone or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
  className="h-11 rounded-xl border px-3 text-sm"
  value={status}
  onChange={(e) => setStatus(e.target.value)}
>
  <option value="all">All statuses</option>
  <option value="new">New</option>
<option value="interested">Interested</option>
<option value="follow_up">Follow-up</option>
<option value="not_interested">
  Not interested
</option>
<option value="lost">Lost</option>
          </select>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {[
  "today",
  "upcoming",
  "completed",
  "cancelled",
].map((x) => (
            <Button
              key={x}
              size="sm"
              variant={view === x ? "default" : "outline"}
              onClick={() => setView(x)}
              className="capitalize"
            >
              {x}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {data.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-muted-foreground">
            {kind === "leads"
              ? "No assigned leads match these filters."
              : "No follow-ups in this view."}
          </div>
        ) : (
          data.items.map((item) => {
            if (kind === "leads") {
              const x = item as Lead;

              return (
                <Link
  href={`/worker/leads/${x.id}`}
  key={x.id}
  className="block rounded-2xl border bg-white p-4 shadow-card"
>
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    {/* Lead info */}
    <div className="min-w-0 flex-1">
      <b className="block break-words">
        {x.name}
      </b>

      <small className="mt-1 block text-muted-foreground">
        {x.phone}
      </small>

      {x.requirement && (
        <small className="mt-0.5 block break-words text-muted-foreground">
          {x.requirement}
        </small>
      )}
    </div>

    {/* Actions */}
    <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
      <select
        className="h-10 min-w-0 flex-1 rounded-xl border bg-white px-3 text-sm sm:w-44 sm:flex-none"
        value={x.status}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onChange={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const nextStatus =
            e.target.value as Lead["status"];

          if (
            nextStatus === "follow_up" ||
            nextStatus === "interested"
          ) {
            setFollowUpLead(x);
            setFollowUpLeadStatus(nextStatus);
            setFollowUpDateTime("");
            setFollowUpNotes("");
            return;
          }

          void updateLeadStatus(x.id, nextStatus);
        }}
      >
        <option value="new">New</option>
        <option value="interested">Interested</option>
        <option value="follow_up">Follow-up</option>
        <option value="not_interested">
          Not interested
        </option>
        <option value="lost">Lost</option>
      </select>

      <div className="w-24 shrink-0">
        {(x.status === "follow_up" ||
          x.status === "interested") && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              setFollowUpLead(x);
              setFollowUpLeadStatus(
                x.status === "interested"
                  ? "interested"
                  : "follow_up",
              );
              setFollowUpDateTime("");
              setFollowUpNotes("");
            }}
          >
            Schedule
          </Button>
        )}
      </div>
    </div>
  </div>
</Link>
              );
            }

            const x = item as FollowUp;

            return (
              <article
                key={x.id}
                className="rounded-2xl border bg-white p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <b>{x.title}</b>

                    <small className="block text-muted-foreground">
                      {new Date(x.scheduledAt).toLocaleString(
                        "en-IN",
                      )}{" "}
                      · {x.leadId.name}
                    </small>

                    {x.notes && (
                      <small className="mt-1 block text-muted-foreground">
                        {x.notes}
                      </small>
                    )}
                  </span>

                  {x.status === "pending" && (
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => void cancelFollowUp(x.id)}
    >
      Cancel
    </Button>

    <Button
      size="sm"
      onClick={() => void complete(x.id)}
    >
      Complete
    </Button>
  </div>
)}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}