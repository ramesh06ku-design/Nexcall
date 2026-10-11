"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LeadManager } from "@/components/agency/leads/lead-manager";

export default function LeadProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  return (
    <div className="space-y-5">
      <Button asChild variant="outline">
        <Link href="/agency/leads">
          ← Back to Lead Projects
        </Link>
      </Button>

      <LeadManager projectId={projectId} />
    </div>
  );
}