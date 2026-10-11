import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
export default function UnauthorizedPage() { return <main className="grid min-h-screen place-items-center bg-background px-5 text-center"><div><ShieldAlert className="mx-auto size-10 text-primary" /><h1 className="mt-4 text-3xl font-extrabold">Access not allowed</h1><p className="mt-2 max-w-md text-muted-foreground">This account does not have permission to open that workspace.</p><Link href="/login" className={cn(buttonVariants(), "mt-6")}>Return to sign in</Link></div></main>; }
