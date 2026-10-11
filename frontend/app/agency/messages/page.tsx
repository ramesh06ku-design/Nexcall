"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";

type Telecaller = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
};

type AgencyMessage = {
  id: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  telecallerId: Telecaller;
};

type MessagesData = {
  items: AgencyMessage[];
};

export default function AgencyMessagesPage() {
  const [messages, setMessages] = useState<AgencyMessage[]>([]);
  const [selected, setSelected] = useState<AgencyMessage | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  const loadMessages = useCallback(async () => {
    try {
      const response = await apiRequest<MessagesData>(
        "/agency/messages",
      );

      setMessages(response.data?.items ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to load messages",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  async function openMessage(item: AgencyMessage) {
    try {
      setOpeningId(item.id);

      const response = await apiRequest<AgencyMessage>(
        `/agency/messages/${item.id}`,
      );

      const opened = response.data ?? item;

      setSelected(opened);

      setMessages((current) =>
        current.map((message) =>
          message.id === item.id
            ? {
                ...message,
                readAt: opened.readAt ?? new Date().toISOString(),
              }
            : message,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to open message",
      );
    } finally {
      setOpeningId(null);
    }
  }

  async function deleteMessage(id: string) {
    const confirmed = window.confirm(
      "Delete this message permanently?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      await apiRequest(`/agency/messages/${id}`, {
        method: "DELETE",
      });

      setMessages((current) =>
        current.filter((message) => message.id !== id),
      );

      if (selected?.id === id) {
        setSelected(null);
      }

      toast.success("Message deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete message",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Messages
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Messages received from your telecallers.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-muted-foreground">
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <MessageSquare className="mx-auto size-9 text-muted-foreground" />
          <p className="mt-3 font-semibold">No messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Telecaller messages will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={openingId === item.id}
              onClick={() => void openMessage(item)}
              className="flex w-full items-start justify-between gap-4 rounded-2xl border bg-white p-4 text-left shadow-card transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">
                    {item.telecallerId?.name ?? "Telecaller"}
                  </p>

                  {!item.readAt && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      Unread
                    </span>
                  )}
                </div>

                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.message}
                </p>
              </div>

              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setSelected(null)}
            aria-label="Close message"
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">
                  {selected.telecallerId?.name ?? "Telecaller"}
                </h2>

                <p className="text-xs text-muted-foreground">
                  {selected.telecallerId?.email}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-5 rounded-xl bg-muted/50 p-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-6">
                {selected.message}
              </p>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Sent{" "}
              {new Date(selected.createdAt).toLocaleString()}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelected(null)}
              >
                Close
              </Button>

              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={deletingId === selected.id}
                onClick={() => void deleteMessage(selected.id)}
              >
                <Trash2 className="mr-2 size-4" />
                {deletingId === selected.id
                  ? "Deleting..."
                  : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}