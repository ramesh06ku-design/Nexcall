"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/components/auth/auth-provider";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api/client";
import { dashboardForRole } from "@/lib/auth/routes";
import type { User } from "@/types";

const passwordSchema = z.string().min(8, "Password must contain at least 8 characters");
const agencyAdminSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: passwordSchema,
});
const workerSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or username"),
  password: passwordSchema,
});

export function LoginForm({ worker = false }: { worker?: boolean }) {
  const router = useRouter();
  const { setAuthenticatedUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const credentials = worker
      ? {
          identifier: String(form.get("identifier") ?? ""),
          password: String(form.get("password") ?? ""),
        }
      : {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        };
    const result = (worker ? workerSchema : agencyAdminSchema).safeParse(credentials);
    if (!result.success) {
      setFieldErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const response = await apiRequest<User>(
        worker ? "/auth/worker-login" : "/auth/login",
        { method: "POST", body: JSON.stringify(result.data) },
      );
      if (!response.data) throw new Error("Authentication response was incomplete");
      setAuthenticatedUser(response.data);
      router.replace(dashboardForRole[response.data.role]);
      router.refresh();
    } catch (reason) {
      if (reason instanceof ApiError && reason.errors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(reason.errors).map(([key, messages]) => [key, messages[0] ?? "Invalid value"]),
          ),
        );
      }
      setError(reason instanceof Error ? reason.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
      {error && (
        <div className="flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
      <label className="block">
        <span className="mb-2 block text-sm font-semibold">
          {worker ? "Email or username" : "Email address"}
        </span>
        <Input
          name={worker ? "identifier" : "email"}
          type={worker ? "text" : "email"}
          autoComplete="username"
          placeholder={worker ? "you@example.com or rohan" : "you@agency.com"}
          aria-invalid={Boolean(fieldErrors[worker ? "identifier" : "email"])}
        />
        {fieldErrors[worker ? "identifier" : "email"] && (
          <span className="mt-1 block text-xs text-red-600">
            {fieldErrors[worker ? "identifier" : "email"]}
          </span>
        )}
      </label>
      <label className="block">
        <span className="mb-2 flex items-center justify-between text-sm font-semibold">
          Password
          <span className="font-medium text-primary">Forgot password?</span>
        </span>
        <PasswordInput
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          aria-invalid={Boolean(fieldErrors.password)}
        />
        {fieldErrors.password && (
          <span className="mt-1 block text-xs text-red-600">{fieldErrors.password}</span>
        )}
      </label>
      <Button className="w-full" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
        <ArrowRight className="size-4" />
      </Button>
      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-xl border border-dashed bg-muted/45 p-4 text-xs text-muted-foreground">
          <p className="font-bold text-foreground">Demo {worker ? "Worker" : "Accounts"}</p>
          {worker ? (
            <p className="mt-2 leading-5">worker@demo.nexcall.com<br />Password: demo1234</p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <p className="leading-5"><b className="text-foreground">Agency</b><br />agency@demo.nexcall.com<br />Password: demo1234</p>
              <p className="leading-5"><b className="text-foreground">Admin</b><br />admin@demo.nexcall.com<br />Password: demo1234</p>
            </div>
          )}
        </div>
      )}
      <p className="text-center text-sm text-muted-foreground">
        {worker ? (
          <>
            Agency owner?{" "}
            <Link className="font-semibold text-primary" href="/login">
              Agency / Admin login
            </Link>
          </>
        ) : (
          <span className="flex flex-col gap-2"><span>Worker or telecaller? <Link className="font-semibold text-primary" href="/worker-login">Worker Login</Link></span><span>New to NexCall? <Link className="font-semibold text-primary" href="/signup">Create your agency</Link></span></span>
        )}
      </p>
    </form>
  );
}
