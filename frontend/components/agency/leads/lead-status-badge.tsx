import { Badge } from "@/components/ui/badge";
import type { LeadStatus } from "@/types";
export const leadStatusLabels:Record<LeadStatus,string>={new:"New",contacted:"Contacted",interested:"Interested",follow_up:"Follow-up",converted:"Converted",not_interested:"Not Interested",lost:"Lost"};
export function LeadStatusBadge({status}:{status:LeadStatus}){return <Badge variant={status==="converted"?"success":status==="lost"||status==="not_interested"?"neutral":"default"}>{leadStatusLabels[status]}</Badge>;}
