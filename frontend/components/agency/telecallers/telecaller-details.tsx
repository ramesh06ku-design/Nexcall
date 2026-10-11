"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Phone, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import type { Telecaller } from "@/types";
export function TelecallerDetails({ id }: { id: string }) {
  const { user } = useAuth(); const [person, setPerson] = useState<Telecaller | null>(null); const [error, setError] = useState(false);
  useEffect(() => { apiRequest<Telecaller>(`/agency/telecallers/${id}`).then(r => setPerson(r.data ?? null)).catch(() => setError(true)); }, [id]);
  if (error) return <div className="rounded-2xl border bg-white p-10 text-center"><h1 className="font-bold">Telecaller not found</h1><Button asChild className="mt-4" variant="outline"><Link href="/agency/telecallers">Back to Telecallers</Link></Button></div>;
  if (!person) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  return <div className="space-y-5"><Button asChild variant="ghost"><Link href="/agency/telecallers"><ArrowLeft className="size-4" /> Telecallers</Link></Button><div className="rounded-2xl border bg-white p-6 shadow-card"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-xl font-extrabold text-primary">{person.name.split(" ").map(x => x[0]).join("").slice(0,2)}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold">{person.name}</h1><Badge variant={person.status === "active" ? "success" : "neutral"}>{person.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{person.email}</p></div></div><dl className="mt-7 grid gap-4 border-t pt-6 sm:grid-cols-3"><div><dt className="text-xs text-muted-foreground">Phone</dt><dd className="mt-1 flex items-center gap-2 text-sm font-semibold"><Phone className="size-4" />{person.phone || "Not provided"}</dd></div><div><dt className="text-xs text-muted-foreground">Joined</dt><dd className="mt-1 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="size-4" />{new Date(person.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</dd></div><div><dt className="text-xs text-muted-foreground">Agency</dt><dd className="mt-1 flex items-center gap-2 text-sm font-semibold"><UserRound className="size-4" />{user?.agency?.name ?? "Your agency"}</dd></div></dl></div><div><h2 className="text-lg font-bold">Activity preview</h2><p className="text-sm text-muted-foreground">These placeholders will connect to activity APIs in a future phase.</p><div className="mt-4 grid gap-3 sm:grid-cols-3">{["Today's Calls","Leads Handled","Follow-ups"].map(label => <div key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-extrabold">0</p></div>)}</div></div></div>;
}
