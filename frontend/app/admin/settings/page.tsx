
"use client";

import { useEffect, useState } from "react";
import {
  UserRound,
  ShieldCheck,
  LockKeyhole,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

import { apiRequest } from "@/lib/api/client";

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
};

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(
    null,
  );

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] =
    useState("");
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await apiRequest<AdminProfile>(
          "/auth/me",
        );

        if (!response.data) {
          throw new Error("Profile data not available.");
        }

        setProfile(response.data);
        setName(response.data.name);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load profile.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  async function handleProfileUpdate(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setProfileMessage("");

    const trimmedName = name.trim();

    if (
      trimmedName.length < 2 ||
      trimmedName.length > 100
    ) {
      setError(
        "Name must contain between 2 and 100 characters.",
      );
      return;
    }

    setSavingProfile(true);

    try {
      const response = await apiRequest<AdminProfile>(
        "/admin/settings/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            name: trimmedName,
          }),
        },
      );

      if (!response.data) {
        throw new Error("Profile update response missing.");
      }

      setProfile(response.data);
      setName(response.data.name);
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setPasswordMessage("");

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 72
    ) {
      setError(
        "New password must contain between 8 and 72 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      await apiRequest(
        "/admin/settings/password",
        {
          method: "PATCH",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Loading admin settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">
          PLATFORM ADMIN
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Platform Settings
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage your admin profile and account security.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">
                Admin Profile
              </h2>
              <p className="text-sm text-muted-foreground">
                Your platform administrator details.
              </p>
            </div>
          </div>

          {profile && (
            <form
              onSubmit={handleProfileUpdate}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="admin-name"
                  className="text-sm font-medium"
                >
                  Full Name
                </label>

                <input
                  id="admin-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  minLength={2}
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Email Address
                </label>

                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Account Role: {profile.role}
              </div>

              {profileMessage && (
                <p
                  role="status"
                  className="text-sm text-green-600"
                >
                  {profileMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {savingProfile
                  ? "Saving..."
                  : "Save Profile"}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">
                Change Password
              </h2>
              <p className="text-sm text-muted-foreground">
                Update your administrator login password.
              </p>
            </div>
          </div>

          <form
            onSubmit={handlePasswordChange}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="current-password"
                className="text-sm font-medium"
              >
                Current Password
              </label>

              <input
                id="current-password"
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="text-sm font-medium"
              >
                New Password
              </label>

              <input
                id="new-password"
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium"
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowPasswords((previous) => !previous)
              }
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              {showPasswords ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showPasswords
                ? "Hide Passwords"
                : "Show Passwords"}
            </button>

            {passwordMessage && (
              <p
                role="status"
                className="text-sm text-green-600"
              >
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              <LockKeyhole className="h-4 w-4" />
              {savingPassword
                ? "Updating..."
                : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
