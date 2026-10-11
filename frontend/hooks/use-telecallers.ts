"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api/client";
import type { PaginatedTelecallers, TelecallerStatus } from "@/types";
export function useTelecallers(search: string, status: "all" | TelecallerStatus, page: number) {
  const [data, setData] = useState<PaginatedTelecallers | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(false);
  const refresh = useCallback(async () => { setLoading(true); setError(false); try { const params = new URLSearchParams({ page: String(page), limit: "20" }); if (search) params.set("search", search); if (status !== "all") params.set("status", status); const response = await apiRequest<PaginatedTelecallers>(`/agency/telecallers?${params}`); setData(response.data ?? null); } catch { setError(true); } finally { setLoading(false); } }, [page, search, status]);
  useEffect(() => { void refresh(); }, [refresh]); return { data, loading, error, refresh };
}
