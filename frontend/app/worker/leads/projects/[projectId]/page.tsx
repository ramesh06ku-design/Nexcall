"use client";

import { useParams } from "next/navigation";

import { WorkerResourceList } from "@/components/worker/worker-resource-list";

export default function WorkerLeadProjectPage() {
  const params = useParams<{ projectId: string }>();

  return (
    <WorkerResourceList
      kind="leads"
      projectId={params.projectId}
    />
  );
}