"use client";
import { ErrorState } from "@/components/shared/states";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="grid min-h-screen place-items-center bg-background p-5"><div className="w-full max-w-lg"><ErrorState retry={reset} /></div></main>; }
