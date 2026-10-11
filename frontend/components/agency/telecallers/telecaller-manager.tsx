"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  CalendarDays,
  Edit3,
  Eye,
  Plus,
  Search,
  UserCheck,
  UserRound,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTelecallers } from "@/hooks/use-telecallers";
import { apiRequest } from "@/lib/api/client";
import type { Telecaller, TelecallerStatus } from "@/types";

function date(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isOnline(lastSeenAt?: string | null) {
  if (!lastSeenAt) return false;

  const lastSeen = new Date(lastSeenAt).getTime();

  if (Number.isNaN(lastSeen)) return false;

  return Date.now() - lastSeen <= 2 * 60 * 1000;
}

function lastSeenText(lastSeenAt?: string | null) {
  if (!lastSeenAt) return "Never seen";

  const value = new Date(lastSeenAt);

  if (Number.isNaN(value.getTime())) return "Never seen";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

export function TelecallerManager() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | TelecallerStatus>("all");
  const [page, setPage] = useState(1);

  const [mode, setMode] = useState<
    "add" | "edit" | "status" | null
  >(null);

  const [selected, setSelected] = useState<Telecaller | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(id);
  }, [searchInput]);

  const { data, loading, error, refresh } = useTelecallers(
    search,
    status,
    page,
  );

  const stats = [
    {
      label: "Total Telecallers",
      value: data?.summary.total ?? 0,
      icon: UserRound,
    },
    {
      label: "Active",
      value: data?.summary.active ?? 0,
      icon: UserCheck,
    },
    {
      label: "Inactive",
      value: data?.summary.inactive ?? 0,
      icon: UserX,
    },
  ];

  function open(
    modeValue: "edit" | "status",
    person: Telecaller,
  ) {
    setSelected(person);
    setMode(modeValue);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    setSaving(true);

    try {
      if (mode === "add") {
        await apiRequest("/agency/telecallers", {
          method: "POST",
          body: JSON.stringify({
            name: form.get("name"),
            email: form.get("email"),
            phone: form.get("phone") || undefined,
            password: form.get("password"),
          }),
        });

        toast.success("Telecaller added successfully.");
      } else if (mode === "edit" && selected) {
        await apiRequest(`/agency/telecallers/${selected.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.get("name"),
            phone: form.get("phone") ?? "",
          }),
        });

        toast.success("Telecaller updated successfully.");
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

  async function changeStatus() {
    if (!selected) return;

    const next =
      selected.status === "active" ? "inactive" : "active";

    setSaving(true);

    try {
      await apiRequest(
        `/agency/telecallers/${selected.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: next,
          }),
        },
      );

      toast.success(
        next === "active"
          ? "Telecaller activated."
          : "Telecaller deactivated.",
      );

      setMode(null);
      setSelected(null);

      await refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const list = data?.items ?? [];

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            Team
          </p>

          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
            Telecallers
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Manage your team and track who&apos;s active.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelected(null);
            setMode("add");
          }}
        >
          <Plus className="size-4" />
          Add Telecaller
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-card"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon className="size-5" />
            </span>

            <div>
              <p className="text-xs text-muted-foreground">
                {label}
              </p>

              <p className="text-2xl font-extrabold">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">
            Search telecallers
          </span>

          <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />

          <Input
            className="pl-9"
            placeholder="Search telecallers..."
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
          />
        </label>

        <select
          aria-label="Filter by status"
          className="h-11 rounded-xl border bg-white px-4 text-sm"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3 rounded-2xl border bg-white p-4">
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              className="h-16 w-full"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <h2 className="font-bold">
            Couldn&apos;t load your telecallers.
          </h2>

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
          <UserRound className="mx-auto size-9 text-slate-300" />

          <h2 className="mt-3 font-bold">
            No telecallers yet
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Add your first telecaller to start building your
            team.
          </p>

          <Button
            className="mt-5"
            onClick={() => setMode("add")}
          >
            <Plus className="size-4" />
            Add Telecaller
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-card">
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  {[
                    "Telecaller",
                    "Phone",
                    "Status",
                    "Actions",
                  ].map((item) => (
                    <th
                      key={item}
                      className="px-5 py-3 font-semibold"
                    >
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y">
                {list.map((person) => {
                  const online = isOnline(
                    person.lastSeenAt,
                  );

                  return (
                    <tr
                      key={person.id}
                      className="hover:bg-muted/25"
                    >
                      <td className="px-5 py-4">
                        <b>{person.name}</b>

                        <p className="text-xs text-muted-foreground">
                          {person.email}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Last Seen:{" "}
                          {lastSeenText(
                            person.lastSeenAt,
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Joined: {date(person.createdAt)}
                        </p>
                      </td>

                      <td className="px-5">
                        {person.phone || "—"}
                      </td>

                      <td className="px-5">
                        <div className="flex flex-col items-start gap-1.5">
                          <div
  className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${
    online
      ? "bg-green-50 text-green-700"
      : "bg-red-50 text-red-700"
  }`}
>
  <span
    className={`size-2 rounded-full ${
      online ? "bg-green-500" : "bg-red-500"
    }`}
  />

  {online ? "Online" : "Offline"}
</div>
                          <span className="text-xs text-muted-foreground">
                            Account: {person.status}
                          </span>
                        </div>
                      </td>

                      <td className="px-5">
                        <div className="flex gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                          >
                            <Link
                              href={`/agency/telecallers/${person.id}`}
                            >
                              <Eye className="size-4" />
                              View
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              open("edit", person)
                            }
                          >
                            <Edit3 className="size-4" />
                            Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              open("status", person)
                            }
                          >
                            {person.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y md:hidden">
            {list.map((person) => {
              const online = isOnline(
                person.lastSeenAt,
              );

              return (
                <article
                  key={person.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <b>{person.name}</b>

                      <p className="break-all text-xs text-muted-foreground">
                        {person.email}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge
                        variant={
                          online
                            ? "success"
                            : "neutral"
                        }
                      >
                        {online
                          ? "Online"
                          : "Offline"}
                      </Badge>

                      <span className="text-[11px] text-muted-foreground">
                        Account: {person.status}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm">
                    {person.phone || "No phone"}
                  </p>

                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <p>
                      Last Seen:{" "}
                      {lastSeenText(
                        person.lastSeenAt,
                      )}
                    </p>

                    <p className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      Joined {date(person.createdAt)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <Link
                        href={`/agency/telecallers/${person.id}`}
                      >
                        View
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        open("edit", person)
                      }
                    >
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        open("status", person)
                      }
                    >
                      {person.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() =>
              setPage((current) => current - 1)
            }
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {page} of {data.totalPages}
          </span>

          <Button
            variant="outline"
            disabled={page === data.totalPages}
            onClick={() =>
              setPage((current) => current + 1)
            }
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={mode === "add" || mode === "edit"}
        onOpenChange={(openValue) => {
          if (!openValue) setMode(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {mode === "add"
              ? "Add Telecaller"
              : "Edit Telecaller"}
          </DialogTitle>

          <DialogDescription>
            {mode === "add"
              ? "Create a secure worker account for your agency."
              : "Update the telecaller's profile details."}
          </DialogDescription>

          <form
            className="mt-5 space-y-4"
            onSubmit={submit}
          >
            <label className="block text-sm font-semibold">
              Full Name
              <Input
                name="name"
                className="mt-2"
                required
                minLength={2}
                defaultValue={selected?.name}
              />
            </label>

            {mode === "add" && (
              <label className="block text-sm font-semibold">
                Email
                <Input
                  name="email"
                  className="mt-2"
                  type="email"
                  required
                />
              </label>
            )}

            <label className="block text-sm font-semibold">
              Phone
              <Input
                name="phone"
                className="mt-2"
                defaultValue={selected?.phone}
              />
            </label>

            {mode === "add" && (
              <label className="block text-sm font-semibold">
                Password
                <PasswordInput
                  name="password"
                  className="mt-2"
                  required
                  minLength={8}
                />

                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  Minimum 8 characters.
                </span>
              </label>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode(null)}
              >
                Cancel
              </Button>

              <Button disabled={saving}>
                {saving
                  ? "Saving…"
                  : mode === "add"
                    ? "Add Telecaller"
                    : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === "status"}
        onOpenChange={(openValue) => {
          if (!openValue) setMode(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {selected?.status === "active"
              ? "Deactivate"
              : "Activate"}{" "}
            {selected?.name}?
          </DialogTitle>

          <DialogDescription>
            {selected?.status === "active"
              ? "They will no longer be able to sign in."
              : "They will be able to sign in again."}
          </DialogDescription>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setMode(null)}
            >
              Cancel
            </Button>

            <Button
              disabled={saving}
              onClick={() => void changeStatus()}
            >
              {selected?.status === "active"
                ? "Deactivate"
                : "Activate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}