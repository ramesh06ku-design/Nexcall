"use client";

import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "@/lib/api/client";

interface WorkerLeadProject {
  id: string;
  name: string;
  leadCount: number;
  createdAt: string;
}

interface WorkerLeadProjectsResponse {
  items: WorkerLeadProject[];
}

export function useWorkerLeadProjects() {
  const [data, setData] =
    useState<WorkerLeadProjectsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await apiRequest<WorkerLeadProjectsResponse>(
          "/worker/lead-projects",
        );

      setData(response.data ?? { items: [] });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not load assigned projects.",
      );
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