import type { NextRequest } from "next/server";
import type { ApiResponse, User } from "@/types";

function authMeUrl() {
  if (process.env.BACKEND_URL) return `${process.env.BACKEND_URL}/api/auth/me`;
  const publicApi = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  return `${publicApi.replace(/\/$/, "")}/auth/me`;
}

export async function getRequestUser(request: NextRequest): Promise<User | null> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  try {
    const response = await fetch(authMeUrl(), {
      headers: { cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ApiResponse<User>;
    return payload.data ?? null;
  } catch {
    return null;
  }
}
