"use client";

import { useEffect } from "react";
import { apiRequest } from "@/lib/api/client";

export function WorkerPresence() {
  useEffect(() => {
    async function heartbeat() {
      try {
        await apiRequest("/worker/heartbeat", {
          method: "POST",
        });
      } catch {
        // Presence update should not interrupt worker usage.
      }
    }

    void heartbeat();

    const interval = window.setInterval(() => {
      void heartbeat();
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return null;
}