import type { Request, Response } from "express";
import { z } from "zod";
import { createTelecallerForAgency, getTelecallerForAgency, listTelecallersForAgency, updateTelecallerForAgency } from "../services/telecaller.service.js";
import { AppError } from "../utils/AppError.js";
import {
  archiveLeadForAgency,
  createLeadForAgency,
  deleteLeadForAgency,
  deleteLeadProjectForAgency,
  deleteLeadsForAgency,
  getLeadForAgency,
  importLeadsForAgency,
  LEAD_STATUSES,
  listLeadProjectsForAgency,
  listLeadsForAgency,
  updateLeadForAgency,
  updateLeadProjectAssignmentsForAgency,
} from "../services/lead.service.js";
import { CALL_OUTCOMES } from "../models/Call.js";
import { createCallForAgency,getCallForAgency,listCallsForAgency,listLeadCallsForAgency } from "../services/call.service.js";
import { FOLLOW_UP_STATUSES } from "../models/FollowUp.js";
import { createFollowUpForAgency,getFollowUpForAgency,listFollowUpsForAgency,updateFollowUpForAgency } from "../services/followup.service.js";
import { getAgencyAnalytics } from "../services/analytics.service.js";
import { createFinance, deleteFinance, getFinance, listFinance, updateFinance } from "../services/finance.service.js";
import { updateAgencySettings } from "../services/settings.service.js";
import {
  listMessagesForAgency,
  readMessageForAgency,
  deleteMessageForAgency,
} from "../services/message.service.js";
export async function createTelecallerController(req: Request, res: Response) { const data = await createTelecallerForAgency(req.user!, req.body); res.status(201).json({ success: true, data, message: "Telecaller added successfully." }); }
export async function listTelecallersController(req: Request, res: Response) { const result = z.object({ search: z.string().trim().max(100).optional(), status: z.enum(["active", "inactive"]).optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().min(1).max(50).default(20) }).safeParse(req.query); if (!result.success) throw new AppError(400, "Invalid telecaller filters"); res.json({ success: true, data: await listTelecallersForAgency(req.user!, result.data) }); }
export async function getTelecallerController(req: Request, res: Response) { res.json({ success: true, data: await getTelecallerForAgency(req.user!, String(req.params.id)) }); }
export async function updateTelecallerController(req: Request, res: Response) { res.json({ success: true, data: await updateTelecallerForAgency(req.user!, String(req.params.id), req.body), message: "Telecaller updated successfully." }); }
export async function createLeadController(req: Request, res: Response) { res.status(201).json({ success:true, data:await createLeadForAgency(req.user!,req.body), message:"Lead added successfully." }); }
export async function listLeadsController(req: Request, res: Response) { 
  const parsed=z.object({ search:z.string().trim().max(100).optional(), 
    status:z.enum(LEAD_STATUSES).optional(), 
    assignedTo:z.string().trim().optional(), 
    projectId:z.string().trim().min(1).optional(),
    unprojectedOnly:z.enum(["true","false"])
  .transform(x=>x==="true")
  .optional(),
    archived:z.enum(["true","false"]).transform(x=>x==="true").default(false), 
    page:z.coerce.number().int().positive().default(1), 
    limit:z.coerce.number().int().min(1).max(50).default(20) }).
    safeParse(req.query); 
    if(!parsed.success) 
      throw new AppError(400,"Invalid lead filters"); 
    res.json({success:true,data:await listLeadsForAgency(req.user!,parsed.data)}); 
  }

export async function listLeadProjectsController(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await listLeadProjectsForAgency(req.user!),
  });
}

export async function updateLeadProjectAssignmentsController(
  req: Request,
  res: Response,
) {
  const workerIds = Array.isArray(req.body.workerIds)
    ? req.body.workerIds.map(String)
    : [];

  res.json({
    success: true,
    data: await updateLeadProjectAssignmentsForAgency(
      req.user!,
      String(req.params.id),
      workerIds,
    ),
    message: "Project telecallers updated successfully.",
  });
}

export async function deleteLeadProjectController(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await deleteLeadProjectForAgency(
      req.user!,
      String(req.params.id),
    ),
    message: "Lead project and all its leads permanently deleted.",
  });
}

export async function deleteLeadsController(
  req: Request,
  res: Response,
) {
  const leadIds = Array.isArray(req.body.ids)
    ? req.body.ids.map(String)
    : [];

  res.json({
    success: true,
    data: await deleteLeadsForAgency(req.user!, leadIds),
    message: "Selected leads permanently deleted.",
  });
}

export async function getLeadController(req: Request,res: Response){res.json({success:true,data:await getLeadForAgency(req.user!,String(req.params.id))});}
export async function updateLeadController(req: Request,res: Response){res.json({success:true,data:await updateLeadForAgency(req.user!,String(req.params.id),req.body),message:"Lead updated successfully."});}
export async function archiveLeadController(req: Request,res: Response){res.json({success:true,data:await archiveLeadForAgency(req.user!,String(req.params.id)),message:"Lead archived."});}
export async function deleteLeadController(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await deleteLeadForAgency(
      req.user!,
      String(req.params.id),
    ),
    message: "Lead permanently deleted.",
  });
}
export async function importLeadsController(req:Request,res:Response){res.status(201).json({success:true,data:await importLeadsForAgency(req.user!,req.body),message:"Lead import completed."});}
export async function createCallController(req:Request,res:Response){res.status(201).json({success:true,data:await createCallForAgency(req.user!,req.body),message:"Call logged successfully."});}
export async function listCallsController(req:Request,res:Response){const parsed=z.object({search:z.string().trim().max(100).optional(),telecaller:z.string().trim().optional(),outcome:z.enum(CALL_OUTCOMES).optional(),range:z.enum(["today","7d","30d","all"]).default("7d"),page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(50).default(20)}).safeParse(req.query);if(!parsed.success)throw new AppError(400,"Invalid call filters");res.json({success:true,data:await listCallsForAgency(req.user!,parsed.data)});}
export async function getCallController(req:Request,res:Response){res.json({success:true,data:await getCallForAgency(req.user!,String(req.params.id))});}
export async function listLeadCallsController(req:Request,res:Response){res.json({success:true,data:await listLeadCallsForAgency(req.user!,String(req.params.id))});}
export async function createFollowUpController(req:Request,res:Response){res.status(201).json({success:true,data:await createFollowUpForAgency(req.user!,req.body),message:"Follow-up created."});}
export async function listFollowUpsController(req:Request,res:Response){const p=z.object({search:z.string().trim().max(100).optional(),telecaller:z.string().optional(),status:z.enum(FOLLOW_UP_STATUSES).optional(),view:z.enum(["today","upcoming","overdue","all"]).default("today"),page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(50).default(20)}).safeParse(req.query);if(!p.success)throw new AppError(400,"Invalid follow-up filters");res.json({success:true,data:await listFollowUpsForAgency(req.user!,p.data)});}
export async function getFollowUpController(req:Request,res:Response){res.json({success:true,data:await getFollowUpForAgency(req.user!,String(req.params.id))});}
export async function updateFollowUpController(req:Request,res:Response){const{action,scheduledAt,notes}=req.body;res.json({success:true,data:await updateFollowUpForAgency(req.user!,String(req.params.id),action,scheduledAt,notes),message:action==="complete"?"Follow-up completed.":action==="cancel"?"Follow-up cancelled.":"Follow-up rescheduled."});}
export async function getAnalyticsController(req:Request,res:Response){const parsed=z.object({range:z.enum(["today","7d","30d"]).default("30d")}).safeParse(req.query);if(!parsed.success)throw new AppError(400,"Invalid analytics range");res.json({success:true,data:await getAgencyAnalytics(req.user!,parsed.data.range)});}
export async function createFinanceController(req:Request,res:Response){res.status(201).json({success:true,data:await createFinance(req.user!,req.body),message:"Finance entry created."});}
export async function listFinanceController(req:Request,res:Response){const parsed=z.object({search:z.string().trim().max(160).optional(),workerId:z.string().optional(),status:z.enum(["opened","closed","cancelled"]).optional(),page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(50).default(20)}).safeParse(req.query);if(!parsed.success)throw new AppError(400,"Invalid finance filters");res.json({success:true,data:await listFinance(req.user!,parsed.data)});}
export async function getFinanceController(req:Request,res:Response){res.json({success:true,data:await getFinance(req.user!,String(req.params.id))});}
export async function updateFinanceController(req:Request,res:Response){res.json({success:true,data:await updateFinance(req.user!,String(req.params.id),req.body),message:"Finance entry updated."});}

export async function deleteFinanceController(req:Request,res:Response){res.json({success:true,data:await deleteFinance(req.user!,String(req.params.id)),message:"Finance entry deleted."});}
export async function updateAgencySettingsController(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await updateAgencySettings(req.user!, req.body),
    message: "Agency settings updated successfully.",
  });
}

export async function listMessagesController(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await listMessagesForAgency(req.user!),
  });
}

export async function readMessageController(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await readMessageForAgency(
      req.user!,
      String(req.params.id),
    ),
  });
}

export async function deleteMessageController(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await deleteMessageForAgency(
      req.user!,
      String(req.params.id),
    ),
    message: "Message deleted successfully.",
  });
}