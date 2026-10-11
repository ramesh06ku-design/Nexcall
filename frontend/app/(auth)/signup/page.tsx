import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
export const metadata: Metadata = { title: "Create your Agency" };
export default function SignupPage() { return <AuthShell title="Create your Agency" description="Set up a clean workspace for your telecalling team."><SignupForm /></AuthShell>; }
