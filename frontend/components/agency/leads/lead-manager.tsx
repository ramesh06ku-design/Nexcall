"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  Archive,
  Eye,
  FileCheck2,
  Flame,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { LeadStatusBadge, leadStatusLabels } from "./lead-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { apiRequest } from "@/lib/api/client";
import { useLeads } from "@/hooks/use-leads";
import { useLeadProjects } from "@/hooks/use-lead-projects";
import type {
  Lead,
  LeadStatus,
  PaginatedTelecallers,
  Telecaller,
} from "@/types";
import { CsvLeadImport } from "./csv-lead-import";

const statuses = Object.keys(leadStatusLabels) as LeadStatus[];

const field =
  "mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/10";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

export function LeadManager({
  projectId,
}: {
  projectId?: string;
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [assignee, setAssignee] = useState("all");
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<
  "add" | "edit" | "archive" | "delete" | "bulk-delete" | null>(null);
  const [addView, setAddView] = useState<"manual" | "csv">("manual");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [projectToAssign, setProjectToAssign] = useState<{
  id: string;
  name: string;
  leadCount: number;
  assignedWorkerIds: string[];
} | null>(null);

const [projectWorkerSearch, setProjectWorkerSearch] = useState("");
const [selectedProjectWorkerIds, setSelectedProjectWorkerIds] = useState<
  string[]
>([]);

  const [projectToDelete, setProjectToDelete] = useState<{
  id: string;
  name: string;
  leadCount: number;
} | null>(null);
  const [saving, setSaving] = useState(false);
  const [telecallers, setTelecallers] = useState<Telecaller[]>([]);

  const availableProjectWorkers = telecallers.filter((telecaller) => {
  const search = projectWorkerSearch.trim().toLowerCase();

  if (!search) return true;

  return (
    telecaller.name.toLowerCase().includes(search) ||
    telecaller.email.toLowerCase().includes(search)
  );
});

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    apiRequest<PaginatedTelecallers>(
      "/agency/telecallers?limit=50&status=active",
    )
      .then((r) => setTelecallers(r.data?.items ?? []))
      .catch(() => setTelecallers([]));
  }, []);

  const { data, loading, error, refresh } = useLeads(
  search,
  status,
  assignee,
  page,
  archived,
  projectId,
  !projectId,
);

  const {
  data: projectData,
  loading: projectsLoading,
  error: projectsError,
  refresh: refreshProjects,
} = useLeadProjects();

  const list = data?.items ?? [];

  const stats = [
    {
      label: "Total Leads",
      value: data?.summary.total ?? 0,
      icon: UsersRound,
    },
    {
      label: "New",
      value: data?.summary.new ?? 0,
      icon: Plus,
    },
    {
      label: "Interested",
      value: data?.summary.interested ?? 0,
      icon: Flame,
    },
    {
      label: "Converted",
      value: data?.summary.converted ?? 0,
      icon: FileCheck2,
    },
  ];

  function open(
  value: "edit" | "archive" | "delete",
  lead: Lead,
) {
  setSelected(lead);
  setMode(value);
}

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    const payload = {
      name: f.get("name"),
      phone: f.get("phone"),
      requirement: f.get("requirement"),
      email: f.get("email") || undefined,
      company: f.get("company") || undefined,
      source: f.get("source") || undefined,
      status: f.get("status"),
      assignedTo: f.get("assignedTo") || null,
      notes: f.get("notes") || undefined,
    };

    setSaving(true);

    try {
      if (mode === "add") {
        await apiRequest("/agency/leads", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        toast.success("Lead added successfully.");
      } else if (selected) {
        await apiRequest(`/agency/leads/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        toast.success("Lead updated successfully.");
      }

      setMode(null);
      setSelected(null);

      await refresh();
    } catch (reason) {
      toast.error(
        reason instanceof Error
          ? reason.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(lead: Lead, value: LeadStatus) {
    try {
      await apiRequest(`/agency/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });

      toast.success("Lead status updated.");

      await refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  async function archiveLead() {
    if (!selected) return;

    setSaving(true);

    try {
      await apiRequest(`/agency/leads/${selected.id}/archive`, {
        method: "PATCH",
      });

      toast.success("Lead archived.");

      setMode(null);
      setSelected(null);

      await refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead() {
  if (!selected) return;

  setSaving(true);

  try {
    await apiRequest(`/agency/leads/${selected.id}`, {
      method: "DELETE",
    });

    toast.success("Lead permanently deleted.");

    setMode(null);
    setSelected(null);

    await refresh();
  } catch (reason) {
    toast.error(
      reason instanceof Error
        ? reason.message
        : "Could not delete this lead.",
    );
  } finally {
    setSaving(false);
  }
} 

function openProjectAssignment(
  project: NonNullable<typeof projectData>["items"][number],
) {
  setProjectToAssign({
    id: project.id,
    name: project.name,
    leadCount: project.leadCount,
    assignedWorkerIds: project.assignedWorkerIds ?? [],
  });

  setSelectedProjectWorkerIds(project.assignedWorkerIds ?? []);
  setProjectWorkerSearch("");
}

function toggleProjectWorker(workerId: string) {
  setSelectedProjectWorkerIds((current) =>
    current.includes(workerId)
      ? current.filter((id) => id !== workerId)
      : [...current, workerId],
  );
}

async function saveProjectAssignments() {
  if (!projectToAssign) return;

  setSaving(true);

  try {
    await apiRequest(
      `/agency/lead-projects/${projectToAssign.id}/assignments`,
      {
        method: "PATCH",
        body: JSON.stringify({
          workerIds: selectedProjectWorkerIds,
        }),
      },
    );

    toast.success(
      selectedProjectWorkerIds.length === 0
        ? "All telecallers unassigned from this project."
        : "Project telecallers updated successfully.",
    );

    setProjectToAssign(null);
    setProjectWorkerSearch("");
    setSelectedProjectWorkerIds([]);

    await refreshProjects();
  } catch (reason) {
    toast.error(
      reason instanceof Error
        ? reason.message
        : "Could not update project telecallers.",
    );
  } finally {
    setSaving(false);
  }
}

async function deleteProject() {
  if (!projectToDelete) return;

  setSaving(true);

  try {
    const response = await apiRequest<{
      projectId: string;
      deletedLeads: number;
    }>(
      `/agency/lead-projects/${projectToDelete.id}`,
      {
        method: "DELETE",
      },
    );

    toast.success(
      `Project permanently deleted. ${response.data?.deletedLeads ?? 0} leads deleted.`,
    );

    setProjectToDelete(null);

    window.location.reload();
  } catch (reason) {
    toast.error(
      reason instanceof Error
        ? reason.message
        : "Could not delete this project.",
    );
  } finally {
    setSaving(false);
  }
}

async function deleteSelectedLeads() {
  if (selectedLeadIds.length === 0) return;

  setSaving(true);

  try {
    const response = await apiRequest<{
      deletedLeads: number;
    }>("/agency/leads/bulk", {
      method: "DELETE",
      body: JSON.stringify({
        ids: selectedLeadIds,
      }),
    });

    toast.success(
      `${response.data?.deletedLeads ?? selectedLeadIds.length} leads permanently deleted.`,
    );

    setSelectedLeadIds([]);
    setMode(null);

    await refresh();
  } catch (reason) {
    toast.error(
      reason instanceof Error
        ? reason.message
        : "Could not delete selected leads.",
    );
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Pipeline</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Leads</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your leads and keep your team focused on the right prospects.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelected(null);
            setAddView("manual");
            setMode("add");
          }}
        >
          <Plus className="size-4" /> Add Lead
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-card"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon className="size-5" />
            </span>

            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-extrabold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[minmax(200px,1fr)_180px_220px_auto]">
        <label className="relative">
          <span className="sr-only">Search leads</span>

          <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />

          <Input
            className="pl-9"
            placeholder="Search leads..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </label>

        <select
          className={field.replace("mt-1.5 ", "")}
          aria-label="Status filter"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>

          {statuses.map((x) => (
            <option key={x} value={x}>
              {leadStatusLabels[x]}
            </option>
          ))}
        </select>

        <select
          className={field.replace("mt-1.5 ", "")}
          aria-label="Assigned telecaller filter"
          value={assignee}
          onChange={(e) => {
            setAssignee(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All telecallers</option>
          <option value="unassigned">Unassigned</option>

          {telecallers.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>

        <label className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => {
              setArchived(e.target.checked);
              setPage(1);
            }}
          />
          Show archived
        </label>
      </div>

      {!projectId && (projectsLoading ? (
  <div className="rounded-2xl border bg-white p-4">
    <Skeleton className="h-16" />
  </div>
) : projectsError ? (
  <div className="rounded-2xl border bg-white p-4 text-sm text-red-600">
    Could not load lead projects.
  </div>
) : projectData?.items.length ? (
  <div className="overflow-hidden rounded-2xl border bg-white shadow-card">
    <div className="border-b px-4 py-3">
      <h2 className="font-bold">Lead Projects</h2>
    </div>

    <div className="divide-y">
      {projectData.items.map((project) => (
        <div
  key={project.id}
  role="button"
  tabIndex={0}
  onClick={() => {
    router.push(`/agency/leads/projects/${project.id}`);
  }}
  onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      router.push(`/agency/leads/projects/${project.id}`);
    }
  }}
  className="flex cursor-pointer items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/30"
>
          <div>
            <p className="font-bold">{project.name}</p>

            <p className="mt-1 text-xs text-muted-foreground">
              {project.leadCount} leads
            </p>
          </div>

          <div
  className="flex items-center gap-2"
  onClick={(event) => event.stopPropagation()}
>
  <Button asChild variant="outline" size="sm">
    <Link href={`/agency/leads/projects/${project.id}`}>
      Open
    </Link>
  </Button>

  <Button
  variant="outline"
  size="sm"
  onClick={() => openProjectAssignment(project)}
>
  Assign
</Button>

  <Button
    variant="ghost"
    size="sm"
    className="text-red-600 hover:text-red-700"
    onClick={() =>
      setProjectToDelete({
        id: project.id,
        name: project.name,
        leadCount: project.leadCount,
      })
    }
  >
    Delete
  </Button>
</div>
        </div>
      ))}
    </div>
  </div>
) : null)}

{selectedLeadIds.length > 0 && (
  <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-3">
    <p className="text-sm font-semibold text-red-700">
      {selectedLeadIds.length} lead
      {selectedLeadIds.length === 1 ? "" : "s"} selected
    </p>

    <Button
  size="sm"
  className="bg-red-600 text-white hover:bg-red-700"
  onClick={() => setMode("bulk-delete")}
>
  Delete Selected
</Button>
  </div>
)}

      {loading ? (
        <div className="space-y-3 rounded-2xl border bg-white p-4">
          {[1, 2, 3, 4].map((x) => (
            <Skeleton key={x} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <b>Couldn&apos;t load leads.</b>
          <br />

          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void refresh()}
          >
            Try Again
          </Button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <UsersRound className="mx-auto size-9 text-slate-300" />

          <h2 className="mt-3 font-bold">
            {search || status !== "all" || assignee !== "all"
              ? "No leads found"
              : "No leads yet"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {search || status !== "all" || assignee !== "all"
              ? "Try changing your search or filters."
              : "Add your first lead to start managing your team's pipeline."}
          </p>

          {!archived && (
            <Button className="mt-5" onClick={() => setMode("add")}>
              <Plus className="size-4" /> Add Lead
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-card">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  <>
  <th className="px-4 py-3">
    <input
      type="checkbox"
      aria-label="Select all leads"
      checked={
        list.length > 0 &&
        list.every((lead) =>
          selectedLeadIds.includes(lead.id),
        )
      }
      onChange={(event) => {
        if (event.target.checked) {
          setSelectedLeadIds(
            list.map((lead) => lead.id),
          );
        } else {
          setSelectedLeadIds([]);
        }
      }}
    />
  </th>

  {[
    "Lead",
    "Phone",
    "Status",
    "Assigned To",
    "Source",
    "Created",
    "Actions",
  ].map((x) => (
    <th key={x} className="px-4 py-3">
      {x}
    </th>
  ))}
</>
                </tr>
              </thead>

              <tbody className="divide-y">
                {list.map((lead) => (
                  <tr key={lead.id} className="hover:bg-muted/25">
                    <td className="px-4">
  <input
    type="checkbox"
    aria-label={`Select ${lead.name}`}
    checked={selectedLeadIds.includes(lead.id)}
    onChange={(event) => {
      if (event.target.checked) {
        setSelectedLeadIds((current) => [
          ...current,
          lead.id,
        ]);
      } else {
        setSelectedLeadIds((current) =>
          current.filter((id) => id !== lead.id),
        );
      }
    }}
  />
</td>
                    <td className="px-4 py-4">
                      <b>{lead.name}</b>

                      <p className="text-xs text-muted-foreground">
                        {lead.email || lead.company || "—"}
                      </p>
                    </td>

                    <td className="px-4">{lead.phone}</td>

                    <td className="px-4">
                      <select
                        aria-label={`Status for ${lead.name}`}
                        className="rounded-lg border bg-white p-2 text-xs"
                        value={lead.status}
                        onChange={(e) =>
                          void changeStatus(
                            lead,
                            e.target.value as LeadStatus,
                          )
                        }
                      >
                        {statuses.map((x) => (
                          <option key={x} value={x}>
                            {leadStatusLabels[x]}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4">
                      {lead.assignedTo?.name || "Unassigned"}
                    </td>

                    <td className="px-4">{lead.source || "—"}</td>

                    <td className="px-4 text-muted-foreground">
                      {date(lead.createdAt)}
                    </td>

                    <td className="px-4">
                      <div className="flex gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/agency/leads/${lead.id}`}>
                            <Eye className="size-4" /> View
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => open("edit", lead)}
                        >
                          Edit
                        </Button>

                        {!lead.archived && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => open("archive", lead)}
                          >
                            <Archive className="size-4" /> Archive
                          </Button>
                        )}

                        <Button 
                          variant="ghost"
                          size="sm" 
                          onClick={() => open("delete", lead)}
                          className="text-red-600 hover:text-red-700">
                            Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y md:hidden">
            {list.map((lead) => (
              <article key={lead.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <b>{lead.name}</b>
                    <p className="text-xs text-muted-foreground">
                      {lead.email || "No email"}
                    </p>
                  </div>

                  <LeadStatusBadge status={lead.status} />
                </div>

                <p className="mt-3 text-sm">{lead.phone}</p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p>
                    Assigned:{" "}
                    <b className="text-foreground">
                      {lead.assignedTo?.name || "Unassigned"}
                    </b>
                  </p>

                  <p>
                    Source:{" "}
                    <b className="text-foreground">{lead.source || "—"}</b>
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/agency/leads/${lead.id}`}>View</Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => open("edit", lead)}
                  >
                    Edit
                  </Button>

                  {!lead.archived && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => open("archive", lead)}
                    >
                      Archive
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => open("delete", lead)}
                    className="text-red-600 hover:text-red-700">
                      Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((x) => x - 1)}
          >
            Previous
          </Button>

          <span className="self-center text-sm text-muted-foreground">
            Page {page} of {data.totalPages}
          </span>

          <Button
            variant="outline"
            disabled={page === data.totalPages}
            onClick={() => setPage((x) => x + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={mode === "add" || mode === "edit"}
        onOpenChange={(v) => {
          if (!v) setMode(null);
        }}
      >
        <DialogContent
          className={`max-h-[90vh] overflow-y-auto ${
            mode === "add" && addView === "csv" ? "max-w-4xl" : ""
          }`}
        >
          <DialogTitle>{mode === "add" ? "Add Lead" : "Edit Lead"}</DialogTitle>

          <DialogDescription>
            {mode === "add"
              ? "Add one lead or import leads from a supported file."
              : "Keep the essentials clear for your team."}
          </DialogDescription>

          {mode === "add" ? (
            <Tabs
              className="mt-4"
              value={addView}
              onValueChange={(value) => setAddView(value as typeof addView)}
            >
              <div className="flex justify-center">
                <TabsList className="grid w-full max-w-sm grid-cols-2">
                  <TabsTrigger value="manual">Add Lead</TabsTrigger>
                  <TabsTrigger value="csv">Import Leads</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="manual">
                <LeadForm
                  selected={selected}
                  telecallers={telecallers}
                  saving={saving}
                  mode="add"
                  submit={submit}
                  close={() => setMode(null)}
                />
              </TabsContent>

              <TabsContent value="csv">
                <CsvLeadImport
                  telecallers={telecallers}
                  onCancel={() => setMode(null)}
                  onImported={refresh}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <LeadForm
              selected={selected}
              telecallers={telecallers}
              saving={saving}
              mode="edit"
              submit={submit}
              close={() => setMode(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === "archive"}
        onOpenChange={(v) => {
          if (!v) setMode(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Archive this lead?</DialogTitle>

          <DialogDescription>
            Archived leads won&apos;t appear in your active lead list.
          </DialogDescription>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setMode(null)}>
              Cancel
            </Button>

            <Button disabled={saving} onClick={() => void archiveLead()}>
              Archive
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
  open={mode === "delete"}
  onOpenChange={(v) => {
    if (!v) {
      setMode(null);
      setSelected(null);
    }
  }}
>
  <DialogContent>
    <DialogTitle>Permanently delete this lead?</DialogTitle>

    <DialogDescription>
      {selected
        ? `${selected.name} will be permanently deleted. This action cannot be undone.`
        : "This lead will be permanently deleted. This action cannot be undone."}
    </DialogDescription>

    <div className="mt-6 flex justify-end gap-2">
      <Button
        variant="outline"
        disabled={saving}
        onClick={() => {
          setMode(null);
          setSelected(null);
        }}
      >
        Cancel
      </Button>

      <Button
        disabled={saving}
        onClick={() => void deleteLead()}
        className="bg-red-600 text-white hover:bg-red-700"
      >
        {saving ? "Deleting…" : "Delete Permanently"}
      </Button>
    </div>
  </DialogContent>
</Dialog>

<Dialog
  open={projectToAssign !== null}
  onOpenChange={(open) => {
    if (!open && !saving) {
      setProjectToAssign(null);
      setProjectWorkerSearch("");
      setSelectedProjectWorkerIds([]);
    }
  }}
>
  <DialogContent className="sm:max-w-lg">
    <DialogTitle>Assign Project Leads</DialogTitle>

    <DialogDescription>
      Select telecallers who can access this project and its leads.
    </DialogDescription>

    {projectToAssign && (
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="font-bold">{projectToAssign.name}</p>
          <p className="text-sm text-muted-foreground">
            {projectToAssign.leadCount} leads
          </p>
        </div>

        <Input
          placeholder="Search telecallers..."
          value={projectWorkerSearch}
          onChange={(event) =>
            setProjectWorkerSearch(event.target.value)
          }
        />

        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border p-2">
          {availableProjectWorkers.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No active telecallers found.
            </p>
          ) : (
            availableProjectWorkers.map((telecaller) => (
              <label
                key={telecaller.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selectedProjectWorkerIds.includes(
                    telecaller.id,
                  )}
                  onChange={() =>
                    toggleProjectWorker(telecaller.id)
                  }
                  className="h-4 w-4"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {telecaller.name}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {telecaller.email}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {selectedProjectWorkerIds.length} telecaller
          {selectedProjectWorkerIds.length === 1 ? "" : "s"} selected
        </p>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => {
              setProjectToAssign(null);
              setProjectWorkerSearch("");
              setSelectedProjectWorkerIds([]);
            }}
          >
            Cancel
          </Button>

          <Button
            disabled={saving}
            onClick={() => void saveProjectAssignments()}
          >
            {saving ? "Saving…" : "Save Assignment"}
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

<Dialog
  open={projectToDelete !== null}
  onOpenChange={(open) => {
    if (!open) {
      setProjectToDelete(null);
    }
  }}
>
  <DialogContent>
    <DialogTitle>Permanently delete this project?</DialogTitle>

    <DialogDescription>
      {projectToDelete
        ? `${projectToDelete.name} and all ${projectToDelete.leadCount} leads inside this project will be permanently deleted. This action cannot be undone.`
        : "This project will be permanently deleted."}
    </DialogDescription>

    <div className="mt-6 flex justify-end gap-2">
      <Button
        variant="outline"
        disabled={saving}
        onClick={() => setProjectToDelete(null)}
      >
        Cancel
      </Button>

      <Button
        disabled={saving}
        onClick={() => void deleteProject()}
        className="bg-red-600 text-white hover:bg-red-700"
      >
        {saving ? "Deleting…" : "Delete Permanently"}
      </Button>
    </div>
  </DialogContent>
</Dialog>

<Dialog
  open={mode === "bulk-delete"}
  onOpenChange={(open) => {
    if (!open) {
      setMode(null);
    }
  }}
>
  <DialogContent>
    <DialogTitle>
      Permanently delete selected leads?
    </DialogTitle>

    <DialogDescription>
      You are about to permanently delete{" "}
      {selectedLeadIds.length} selected lead
      {selectedLeadIds.length === 1 ? "" : "s"}.
      This action cannot be undone.
    </DialogDescription>

    <div className="mt-6 flex justify-end gap-2">
      <Button
        variant="outline"
        disabled={saving}
        onClick={() => setMode(null)}
      >
        Cancel
      </Button>

      <Button
        disabled={saving}
        onClick={() => void deleteSelectedLeads()}
        className="bg-red-600 text-white hover:bg-red-700"
      >
        {saving ? "Deleting…" : "Delete Permanently"}
      </Button>
    </div>
  </DialogContent>
</Dialog>

    </div>
  );
}

function LeadForm({
  selected,
  telecallers,
  saving,
  mode,
  submit,
  close,
}: {
  selected: Lead | null;
  telecallers: Telecaller[];
  saving: boolean;
  mode: "add" | "edit";
  submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  close: () => void;
}) {
  return (
    <form
      className="mt-4 grid gap-4 sm:grid-cols-2"
      onSubmit={submit}
    >
      <label className="text-sm font-semibold">
        Full Name *
        <Input
          name="name"
          className="mt-1.5"
          required
          minLength={2}
          defaultValue={selected?.name}
        />
      </label>

      <label className="text-sm font-semibold">
        Phone *
        <Input
          name="phone"
          className="mt-1.5"
          required
          minLength={7}
          defaultValue={selected?.phone}
        />
      </label>

      <label className="text-sm font-semibold">
        Requirement *

        <textarea
          name="requirement"
          required
          minLength={2}
          defaultValue={selected?.requirement ?? ""}
          placeholder="What does this lead need?"
          className="mt-1.5 min-h-20 w-full rounded-xl border px-3 py-2 text-sm"
        />
      </label>

      <label className="text-sm font-semibold">
        Email
        <Input
          name="email"
          className="mt-1.5"
          type="email"
          defaultValue={selected?.email}
        />
      </label>

      <label className="text-sm font-semibold">
        Company
        <Input
          name="company"
          className="mt-1.5"
          defaultValue={selected?.company}
        />
      </label>

      <label className="text-sm font-semibold">
        Source
        <Input
          name="source"
          className="mt-1.5"
          placeholder="Website, referral..."
          defaultValue={selected?.source}
        />
      </label>

      <label className="text-sm font-semibold">
        Status
        <select
          name="status"
          className={field}
          defaultValue={selected?.status ?? "new"}
        >
          {statuses.map((x) => (
            <option key={x} value={x}>
              {leadStatusLabels[x]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold sm:col-span-2">
        Assign To
        <select
          name="assignedTo"
          className={field}
          defaultValue={selected?.assignedTo?._id ?? ""}
        >
          <option value="">Unassigned</option>

          {telecallers.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold sm:col-span-2">
        Notes
        <textarea
          name="notes"
          className="mt-1.5 min-h-24 w-full rounded-xl border p-3 text-sm"
          defaultValue={selected?.notes}
        />
      </label>

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>

        <Button disabled={saving}>
          {saving ? "Saving…" : mode === "add" ? "Add Lead" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
