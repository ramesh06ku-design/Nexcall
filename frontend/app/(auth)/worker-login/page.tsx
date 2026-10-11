import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Telecaller Login" };
export default function WorkerLoginPage() { return <AuthShell title="Telecaller Login" description="Your focused workspace for calls and follow-ups."><LoginForm worker /></AuthShell>; }
