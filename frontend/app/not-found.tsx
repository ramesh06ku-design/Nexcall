import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
export default function NotFound() { return <main className="grid min-h-screen place-items-center bg-background px-5 text-center"><div><p className="text-sm font-bold text-primary">404</p><h1 className="mt-2 text-4xl font-extrabold tracking-tight">This page stepped away.</h1><p className="mt-3 text-muted-foreground">The NexCall page you requested could not be found.</p><Link href="/" className={cn(buttonVariants(), "mt-6")}><ArrowLeft className="size-4" /> Back to NexCall</Link></div></main>; }
