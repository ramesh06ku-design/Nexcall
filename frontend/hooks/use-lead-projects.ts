"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api/client";
import type { LeadProject } from "@/types";

interface LeadProjectsResponse {
  items: LeadProject[];
}

export function useLeadProjects() {
  const [data, setData] = useState<LeadProjectsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await apiRequest<LeadProjectsResponse>(
        "/agency/lead-projects",
      );

      setData(response.data ?? null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}