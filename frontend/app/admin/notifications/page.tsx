
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  RefreshCw,
  Building2,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

import { apiRequest } from "@/lib/api/client";

type NotificationType =
  | "agency_registered"
  | "agency_suspended"
  | "agency_activated"
  | "plan_assigned";

type AdminNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  agencyId: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsData = {
  items: AdminNotification[];
  unreadCount: number;
};

const notificationIcons = {
  agency_registered: Building2,
  agency_suspended: AlertTriangle,
  agency_activated: CheckCircle2,
  plan_assigned: CreditCard,
};

export default function AdminNotificationsPage() {
  const [data, setData] = useState<NotificationsData>({
    items: [],
    unreadCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">(
    "all",
  );

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<NotificationsData>(
        "/admin/notifications",
      );

      if (!response.data) {
        throw new Error("Notifications data not available.");
      }

      setData(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(id: string) {
    setUpdating(true);
    setError("");

    try {
      await apiRequest(
        `/admin/notifications/${id}/read`,
        { method: "PATCH" },
      );

      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification.",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function markAllAsRead() {
    setUpdating(true);
    setError("");

    try {
      await apiRequest(
        "/admin/notifications/read-all",
        { method: "PATCH" },
      );

      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notifications.",
      );
    } finally {
      setUpdating(false);
    }
  }

  const visibleNotifications = data.items.filter(
    (notification) =>
      filter === "all" || !notification.isRead,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">
            PLATFORM ADMIN
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Review important platform events and account alerts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadNotifications()}
            disabled={loading || updating}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={
              loading || updating || data.unreadCount === 0
            }
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />

          <div>
            <p className="font-semibold">
              Platform Notifications
            </p>
            <p className="text-sm text-muted-foreground">
              {data.unreadCount} unread notifications
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === "unread"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Loading notifications...
        </p>
      ) : visibleNotifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted-foreground" />

          <h2 className="mt-4 text-lg font-semibold">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {filter === "unread"
              ? "You're all caught up."
              : "Platform events will appear here once notification tracking is connected."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((notification) => {
            const Icon =
              notificationIcons[notification.type] ?? Bell;

            return (
              <div
                key={notification.id}
                className={`flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-5 ${
                  notification.isRead
                    ? "border-border bg-card"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="rounded-xl bg-muted p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {notification.title}
                      </h3>

                      {!notification.isRead && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Unread
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(
                        notification.createdAt,
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {!notification.isRead && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      void markAsRead(notification.id)
                    }
                    className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
