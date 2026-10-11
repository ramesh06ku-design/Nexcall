"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";


export default function Page() {
  const { user, refreshUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    agencyName: user?.agency?.name ?? "",
    ownerName: user?.name ?? "",
    email: user?.email ?? "",
  });

  function startEditing() {
    setForm({
      agencyName: user?.agency?.name ?? "",
      ownerName: user?.name ?? "",
      email: user?.email ?? "",
    });

    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);

    setForm({
      agencyName: user?.agency?.name ?? "",
      ownerName: user?.name ?? "",
      email: user?.email ?? "",
    });
  }

  async function saveChanges() {
  const agencyName = form.agencyName.trim();
  const ownerName = form.ownerName.trim();
  const email = form.email.trim();

  if (agencyName.length < 2) {
    toast.error("Agency name must be at least 2 characters.");
    return;
  }

  if (ownerName.length < 2) {
    toast.error("Owner name must be at least 2 characters.");
    return;
  }

  if (!email) {
    toast.error("Email is required.");
    return;
  }

  setSaving(true);

  try {
    await apiRequest("/agency/settings", {
      method: "PATCH",
      body: JSON.stringify({
        agencyName,
        ownerName,
        email,
      }),
    });

    await refreshUser();

    setEditing(false);

    toast.success("Agency settings updated successfully.");
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "Could not update agency settings.",
    );
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-primary">
          Workspace
        </p>

        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          Agency settings
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Your current agency and account information.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account</CardTitle>

          {!editing ? (
            <Button
              variant="outline"
              onClick={startEditing}
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
  variant="outline"
  onClick={cancelEditing}
  disabled={saving}
>
  Cancel
</Button>

              <Button
  onClick={saveChanges}
  disabled={saving}
>
  {saving ? "Saving..." : "Save Changes"}
</Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Agency
              </p>

              {editing ? (
                <Input
                  className="mt-2"
                  value={form.agencyName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      agencyName: event.target.value,
                    }))
                  }
                />
              ) : (
                <p className="mt-1 font-semibold">
                  {user?.agency?.name ?? "Not available"}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Owner
              </p>

              {editing ? (
                <Input
                  className="mt-2"
                  value={form.ownerName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ownerName: event.target.value,
                    }))
                  }
                />
              ) : (
                <p className="mt-1 font-semibold">
                  {user?.name}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Email
              </p>

              {editing ? (
                <Input
                  className="mt-2"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              ) : (
                <p className="mt-1 font-semibold">
                  {user?.email}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Account status
              </p>

              <p className="mt-1 font-semibold capitalize">
                {user?.status}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}