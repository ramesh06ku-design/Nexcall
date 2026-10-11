import { LeadDetails } from "@/components/agency/leads/lead-details";
export default async function LeadPage({params}:{params:Promise<{id:string}>}){const{id}=await params;return <LeadDetails id={id}/>;}
