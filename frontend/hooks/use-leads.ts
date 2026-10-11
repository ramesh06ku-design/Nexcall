"use client";
import { useCallback,useEffect,useState } from "react";
import { apiRequest } from "@/lib/api/client";
import type { LeadStatus,PaginatedLeads } from "@/types";
export function useLeads(
  search: string,
  status: "all" | LeadStatus,
  assignedTo: string,
  page: number,
  archived: boolean,
projectId?: string,
unprojectedOnly = false,
)
{const[data,setData]=useState<PaginatedLeads|null>(null);
    const[loading,setLoading]=useState(true);
    const[error,setError]=useState(false);
    const refresh=useCallback(async()=>{setLoading(true);setError(false);try{
        const p=new URLSearchParams({page:String(page),limit:"20",archived:String(archived)});
        if(search)p.set("search",search);if(status!=="all")p.set("status",status);
if(assignedTo!=="all")p.set("assignedTo",assignedTo);
if(projectId)p.set("projectId",projectId);
if(unprojectedOnly)p.set("unprojectedOnly","true");
const r=await apiRequest<PaginatedLeads>(`/agency/leads?${p}`);
setData(r.data??null);
}catch{
    setError(true);}finally{setLoading(false);}},[archived,assignedTo,page,projectId,search,status,unprojectedOnly]);
    useEffect(()=>{void refresh();},[refresh]);return{data,loading,error,refresh};}
