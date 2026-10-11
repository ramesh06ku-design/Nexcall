"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  CalendarCheck,
  Clock3,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import { useFollowUps } from "@/hooks/use-follow-ups";
import type {
  FollowUp,
  FollowUpStatus,
  Lead,
  PaginatedLeads,
  PaginatedTelecallers,
  Telecaller,
} from "@/types";

const control =
  "h-11 rounded-xl border bg-white px-3 text-sm";

const label: {
  [K in FollowUpStatus]: string;
} = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

const format = (v: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));

export function FollowUpManager() {
  const [searchInput, setSearchInput] = useState(""),
    [search, setSearch] = useState(""),
    [view, setView] = useState("today"),
    [telecaller, setTelecaller] = useState("all"),
    [status, setStatus] = useState<
      "all" | FollowUpStatus
    >("all"),
    [page, setPage] = useState(1),
    [mode, setMode] = useState<
      "add" | "reschedule" | "cancel" | null
    >(null),
    [selected, setSelected] =
      useState<FollowUp | null>(null),
    [saving, setSaving] = useState(false),
    [telecallers, setTelecallers] = useState<
      Telecaller[]
    >([]),
    [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    Promise.all([
      apiRequest<PaginatedTelecallers>(
        "/agency/telecallers?limit=50&status=active",
      ),
      apiRequest<PaginatedLeads>(
        "/agency/leads?limit=50",
      ),
    ]).then(([t, l]) => {
      setTelecallers(t.data?.items ?? []);
      setLeads(l.data?.items ?? []);
    });
  }, []);

  const {
    data,
    loading,
    error,
    refresh,
  } = useFollowUps(
    search,
    view,
    telecaller,
    status,
    page,
  );

  const list = data?.items ?? [],
    stats = [
      {
        label: "Today's",
        value: data?.summary.today ?? 0,
        icon: Clock3,
      },    
      {
        label: "Upcoming",
        value: data?.summary.upcoming ?? 0,
        icon: CalendarCheck,
      },
      {
        label: "Completed",
        value: data?.summary.completed ?? 0,
        icon: CalendarCheck,
      },
    ];

  async function create(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    setSaving(true);

    try {
      await apiRequest("/agency/follow-ups", {
        method: "POST",
        body: JSON.stringify({
          leadId: f.get("leadId"),
          telecallerId: f.get("telecallerId"),
          title: f.get("title") || undefined,
          scheduledAt: new Date(
            String(f.get("scheduledAt")),
          ).toISOString(),
          notes: f.get("notes") || undefined,
        }),
      });

      toast.success("Follow-up created.");
      setMode(null);
      await refresh();
    } catch (r) {
      toast.error(
        r instanceof Error
          ? r.message
          : "Couldn't create follow-up.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function action(
    item: FollowUp,
    value: "complete" | "cancel",
  ) {
    try {
      await apiRequest(
        `/agency/follow-ups/${item.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action: value,
          }),
        },
      );

      toast.success(
        value === "complete"
          ? "Follow-up completed."
          : "Follow-up cancelled.",
      );

      setMode(null);
      await refresh();
    } catch {
      toast.error("Couldn't update follow-up.");
    }
  }

  async function reschedule(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    if (!selected) return;

    const f = new FormData(e.currentTarget);

    setSaving(true);

    try {
      await apiRequest(
        `/agency/follow-ups/${selected.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action: "reschedule",
            scheduledAt: new Date(
              String(f.get("scheduledAt")),
            ).toISOString(),
            notes: f.get("notes") || undefined,
          }),
        },
      );

      toast.success("Follow-up rescheduled.");
      setMode(null);
      await refresh();
    } catch (r) {
      toast.error(
        r instanceof Error
          ? r.message
          : "Couldn't update follow-up.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Tasks
          </p>

          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
            Follow-ups
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Stay on top of callbacks and tasks for your
            team.
          </p>
        </div>

        <Button onClick={() => setMode("add")}>
          <Plus className="size-4" /> Add Follow-up
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(
          ({
            label: txt,
            value,
            icon: Icon,
          }) => (
            <div
              key={txt}
              className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-card"
            >
              <Icon className="size-5 text-primary" />

              <div>
                <p className="text-xs text-muted-foreground">
                  {txt}
                </p>

                <p className="text-2xl font-extrabold">
                  {value}
                </p>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
  "today",
  "upcoming",
  "cancelled",
  "all",
].map((x) => (
          <Button
            key={x}
            variant={
              view === x ? "default" : "outline"
            }
            onClick={() => {
              setView(x);
              setPage(1);
            }}
          >
            {x[0]?.toUpperCase()}
            {x.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_200px_160px]">
        <label className="relative">
          <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />

          <Input
            className="pl-9"
            placeholder="Search follow-ups..."
            value={searchInput}
            onChange={(e) =>
              setSearchInput(e.target.value)
            }
          />
        </label>

        <select
          className={control}
          value={telecaller}
          onChange={(e) =>
            setTelecaller(e.target.value)
          }
        >
          <option value="all">
            All Telecallers
          </option>

          {telecallers.map((x) => (
            <option
              key={x.id}
              value={x.id}
            >
              {x.name}
            </option>
          ))}
        </select>

        <select
          className={control}
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value as typeof status,
            )
          }
        >
          <option value="all">
            All statuses
          </option>

          {Object.keys(label).map((x) => (
            <option
              key={x}
              value={x}
            >
              {label[x as FollowUpStatus]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((x) => (
            <Skeleton
              key={x}
              className="h-24"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <b>Couldn&apos;t load follow-ups.</b>
          <br />

          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void refresh()}
          >
            Try Again
          </Button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <CalendarCheck className="mx-auto size-9 text-slate-300" />

          <h2 className="mt-3 font-bold">
            {view === "today"
              ? "No follow-ups today"
              : view === "upcoming"
                ? "No upcoming follow-ups"
                : view === "overdue"
                  ? "No overdue follow-ups"
                  : "No follow-ups yet"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {view === "overdue"
              ? "Great — nothing is waiting."
              : "Your team is all caught up."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item) => {
            const overdue =
              item.status === "pending" &&
              new Date(item.scheduledAt) <
                new Date();

            return (
              <article
                key={item.id}
                className="rounded-2xl border bg-white p-5 shadow-card"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span
                    className={`size-2 rounded-full ${
                      overdue
                        ? "bg-amber-500"
                        : item.status === "completed"
                          ? "bg-emerald-500"
                          : "bg-primary"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{item.title}</b>

                      <span className="rounded-full bg-muted px-2 py-1 text-xs">
                        {overdue
                          ? "Overdue"
                          : label[item.status]}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(item.scheduledAt)} ·{" "}
                      {item.telecallerId.name}
                    </p>

                    {item.notes && (
                      <p className="mt-2 text-sm">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {item.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          void action(
                            item,
                            "complete",
                          )
                        }
                      >
                        Complete
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelected(item);
                          setMode("reschedule");
                        }}
                      >
                        Reschedule
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelected(item);
                          setMode("cancel");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={mode === "add"}
        onOpenChange={(v) => {
          if (!v) setMode(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Add Follow-up</DialogTitle>

          <DialogDescription>
            Schedule a callback or task.
          </DialogDescription>

          <form
            className="mt-4 space-y-4"
            onSubmit={create}
          >
            <label className="block text-sm font-semibold">
              Lead *
              <select
                name="leadId"
                required
                className={`${control} mt-1 w-full`}
              >
                <option value="">
                  Select lead
                </option>

                {leads.map((x) => (
                  <option
                    key={x.id}
                    value={x.id}
                  >
                    {x.name} · {x.phone}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold">
              Telecaller *
              <select
                name="telecallerId"
                required
                className={`${control} mt-1 w-full`}
              >
                <option value="">
                  Select telecaller
                </option>

                {telecallers.map((x) => (
                  <option
                    key={x.id}
                    value={x.id}
                  >
                    {x.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold">
              Title
              <Input
                name="title"
                className="mt-1"
              />
            </label>

            <label className="block text-sm font-semibold">
              Date & Time *
              <Input
                name="scheduledAt"
                type="datetime-local"
                required
                className="mt-1"
              />
            </label>

            <label className="block text-sm font-semibold">
              Notes
              <textarea
                name="notes"
                className="mt-1 min-h-20 w-full rounded-xl border p-3"
              />
            </label>

            <Button
              className="w-full"
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : "Create Follow-up"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === "reschedule"}
        onOpenChange={(v) => {
          if (!v) setMode(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            Reschedule follow-up
          </DialogTitle>

          <form
            className="mt-4 space-y-4"
            onSubmit={reschedule}
          >
            <Input
              name="scheduledAt"
              type="datetime-local"
              required
            />

            <textarea
              name="notes"
              className="min-h-20 w-full rounded-xl border p-3"
              defaultValue={selected?.notes}
            />

            <Button
              className="w-full"
              disabled={saving}
            >
              Reschedule
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === "cancel"}
        onOpenChange={(v) => {
          if (!v) setMode(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            Cancel this follow-up?
          </DialogTitle>

          <DialogDescription>
            The task will remain in history as
            cancelled.
          </DialogDescription>

          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setMode(null)}
            >
              Keep Follow-up
            </Button>

            <Button
              onClick={() =>
                selected &&
                void action(selected, "cancel")
              }
            >
              Cancel Follow-up
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}