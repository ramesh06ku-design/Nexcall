import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
export const metadata: Metadata = { title: "Agency / Admin Login" };
export default function LoginPage() { return <AuthShell title="Agency / Admin Login" description="Sign in to manage your NexCall workspace."><LoginForm /></AuthShell>; }
