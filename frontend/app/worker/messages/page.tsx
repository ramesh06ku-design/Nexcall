    "use client";

    import { useCallback, useEffect, useState } from "react";
    import { MessageSquare, Send, Trash2 } from "lucide-react";
    import { toast } from "sonner";

    import { Button } from "@/components/ui/button";
    import { apiRequest } from "@/lib/api/client";

    type WorkerMessage = {
    id: string;
    message: string;
    readAt: string | null;
    createdAt: string;
    };

    type MessagesData = {
    items: WorkerMessage[];
    };

    export default function WorkerMessagesPage() {
    const [messages, setMessages] = useState<WorkerMessage[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(
        null,
    );

    const loadMessages = useCallback(async () => {
        try {
        const response = await apiRequest<MessagesData>(
            "/worker/messages",
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

    async function sendMessage() {
        const text = message.trim();

        if (!text) {
        toast.error("Please enter a message.");
        return;
        }

        try {
        setSending(true);

        await apiRequest("/worker/messages", {
            method: "POST",
            body: JSON.stringify({
            message: text,
            }),
        });

        setMessage("");
        toast.success("Message sent successfully.");
        await loadMessages();
        } catch (error) {
        toast.error(
            error instanceof Error
            ? error.message
            : "Unable to send message",
        );
        } finally {
        setSending(false);
        }
    }

    async function deleteMessage(id: string) {
        const confirmed = window.confirm(
        "Delete this message?",
        );

        if (!confirmed) return;

        try {
        setDeletingId(id);

        await apiRequest(`/worker/messages/${id}`, {
            method: "DELETE",
        });

        toast.success("Message deleted.");
        await loadMessages();
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
            Send messages directly to your agency.
            </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-card sm:p-5">
            <label className="text-sm font-semibold">
            Send a message
            </label>

            <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Write your message..."
            className="mt-3 w-full resize-none rounded-xl border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
                {message.length}/2000
            </span>

            <Button
                onClick={() => void sendMessage()}
                disabled={sending || !message.trim()}
            >
                <Send className="mr-2 size-4" />
                {sending ? "Sending..." : "Send Message"}
            </Button>
            </div>
        </div>

        <div className="space-y-3">
            <div>
            <h2 className="font-bold">Sent Messages</h2>
            <p className="text-xs text-muted-foreground">
                Messages you have sent to your agency.
            </p>
            </div>

            {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-muted-foreground">
                Loading messages...
            </div>
            ) : messages.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center">
                <MessageSquare className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">
                No messages yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                Messages you send will appear here.
                </p>
            </div>
            ) : (
            messages.map((item) => (
                <div
                key={item.id}
                className="rounded-2xl border bg-white p-4 shadow-card"
                >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                    <p className="whitespace-pre-wrap break-words text-sm">
                        {item.message}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>
                        {new Date(item.createdAt).toLocaleString()}
                        </span>

                        <span>•</span>

                        <span>
                        {item.readAt ? "Read" : "Sent"}
                        </span>
                    </div>
                    </div>

                    <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === item.id}
                    onClick={() => void deleteMessage(item.id)}
                    aria-label="Delete message"
                    className="shrink-0 text-red-600 hover:text-red-700"
                    >
                    <Trash2 className="size-4" />
                    </Button>
                </div>
                </div>
            ))
            )}
        </div>
        </div>
    );
    }