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
import type { User } from "@/types";

const schema = z
  .object({
    agencyName: z.string().trim().min(2, "Enter your agency name"),
    ownerName: z.string().trim().min(2, "Enter the owner name"),
    email: z.email("Enter a valid email"),
    phone: z.string().trim().optional(),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const textFields = [
  { name: "agencyName", label: "Agency name", placeholder: "Northstar Agency", type: "text" },
  { name: "ownerName", label: "Owner name", placeholder: "Aisha Mehta", type: "text" },
  { name: "email", label: "Email", placeholder: "aisha@agency.com", type: "email" },
  { name: "phone", label: "Phone (optional)", placeholder: "+91 98765 43210", type: "tel" },
] as const;

export function SignupForm() {
  const router = useRouter();
  const { setAuthenticatedUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = schema.safeParse(values);
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
      const response = await apiRequest<User>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(result.data),
      });
      if (!response.data) throw new Error("Signup response was incomplete");
      setAuthenticatedUser(response.data);
      router.replace("/agency/dashboard");
      router.refresh();
    } catch (reason) {
      if (reason instanceof ApiError && reason.errors) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(reason.errors).map(([key, messages]) => [key, messages[0] ?? "Invalid value"]),
          ),
        );
      }
      setError(reason instanceof Error ? reason.message : "Unable to create your agency");
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
      <div className="grid gap-5 sm:grid-cols-2">
        {textFields.map((field) => (
          <label
            key={field.name}
            className={field.name === "agencyName" || field.name === "email" ? "sm:col-span-2" : "block"}
          >
            <span className="mb-2 block text-sm font-semibold">{field.label}</span>
            <Input
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              aria-invalid={Boolean(fieldErrors[field.name])}
            />
            {fieldErrors[field.name] && (
              <span className="mt-1 block text-xs text-red-600">{fieldErrors[field.name]}</span>
            )}
          </label>
        ))}
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Password</span>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={Boolean(fieldErrors.password)}
          />
          {fieldErrors.password && (
            <span className="mt-1 block text-xs text-red-600">{fieldErrors.password}</span>
          )}
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Confirm password</span>
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
          />
          {fieldErrors.confirmPassword && (
            <span className="mt-1 block text-xs text-red-600">
              {fieldErrors.confirmPassword}
            </span>
          )}
        </label>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        By creating an agency, you agree to NexCall’s terms and privacy policy.
      </p>
      <Button className="w-full" type="submit" disabled={loading}>
        {loading ? "Creating agency…" : "Create your agency"}
        <ArrowRight className="size-4" />
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-semibold text-primary" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
