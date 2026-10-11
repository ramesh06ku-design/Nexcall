import type { Request, Response } from "express";
import { z } from "zod";
import { CALL_OUTCOMES } from "../models/Call.js";
import { LEAD_STATUSES } from "../models/Lead.js";
import {
  logWorkerCall,
  updateWorkerFollowUp,
  updateWorkerLead,
  updateWorkerProfile,
  workerCalls,
  workerDashboard,
  createWorkerFollowUp,
  workerFollowUps,
  workerLead,
  workerLeadProjects,
  workerLeads,
  updateWorkerPresence,
  createWorkerMessage,
  workerMessages,
  deleteWorkerMessage,
} from "../services/worker.service.js";
import { workerWallet } from "../services/finance.service.js";
import { AppError } from "../utils/AppError.js";

const paging = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function dashboard(req: Request, res: Response) {
  res.json({
    success: true,
    data: await workerDashboard(req.user!),
  });
}

export async function leadProjects(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await workerLeadProjects(req.user!),
  });
}

export async function leads(req: Request, res: Response) {
  const p = paging
    .extend({
  search: z.string().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  projectId: z.string().optional(),
})
    .safeParse(req.query);

  if (!p.success) throw new AppError(400, "Invalid filters");

  res.json({
    success: true,
    data: await workerLeads(req.user!, p.data),
  });
}

export async function lead(req: Request, res: Response) {
  res.json({
    success: true,
    data: await workerLead(req.user!, String(req.params.id)),
  });
}

export async function editLead(req: Request, res: Response) {
  res.json({
    success: true,
    data: await updateWorkerLead(
      req.user!,
      String(req.params.id),
      req.body,
    ),
    message: "Lead updated.",
  });
}

export async function calls(req: Request, res: Response) {
  const p = paging
    .extend({
      range: z.enum(["today", "7d", "30d"]).default("7d"),
    })
    .safeParse(req.query);

  if (!p.success) throw new AppError(400, "Invalid filters");

  res.json({
    success: true,
    data: await workerCalls(
      req.user!,
      p.data.range,
      p.data.page,
      p.data.limit,
    ),
  });
}

export async function logCall(req: Request, res: Response) {
  res.status(201).json({
    success: true,
    data: await logWorkerCall(req.user!, req.body),
    message: "Call logged successfully.",
  });
}

export async function createFollowUp(
  req: Request,
  res: Response,
) {
  const parsed = z
    .object({
  leadId: z.string().trim().min(1),
  scheduledAt: z.string().trim().min(1),
  leadStatus: z.enum(["interested", "follow_up"]),
  notes: z.string().trim().optional(),
})
    .strict()
    .safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(400, "Invalid follow-up details");
  }

  res.status(201).json({
    success: true,
    data: await createWorkerFollowUp(req.user!, {
  leadId: parsed.data.leadId,
  scheduledAt: parsed.data.scheduledAt,
  leadStatus: parsed.data.leadStatus,
  ...(parsed.data.notes !== undefined
    ? { notes: parsed.data.notes }
    : {}),
}),
  });
}

export async function followUps(req: Request, res: Response) {
  const p = paging
    .extend({
      view: z
        .enum([
          "today",
          "upcoming",
          "overdue",
          "completed",
          "cancelled",
        ])
        .default("today"),
    })
    .safeParse(req.query);

  if (!p.success) throw new AppError(400, "Invalid filters");

  res.json({
    success: true,
    data: await workerFollowUps(
      req.user!,
      p.data.view,
      p.data.page,
      p.data.limit,
    ),
  });
}

export async function editFollowUp(
  req: Request,
  res: Response,
) {
  const parsed = z
    .object({
      action: z.enum([
        "complete",
        "reschedule",
        "cancel",
      ]),
      scheduledAt: z.string().optional(),
    })
    .strict()
    .safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(400, "Invalid follow-up action");
  }

  res.json({
    success: true,
    data: await updateWorkerFollowUp(
      req.user!,
      String(req.params.id),
      parsed.data.action,
      parsed.data.scheduledAt,
    ),
    message:
      parsed.data.action === "complete"
        ? "Follow-up completed."
        : parsed.data.action === "cancel"
          ? "Follow-up cancelled."
          : "Follow-up rescheduled.",
  });
} 

export async function createMessage(
  req: Request,
  res: Response,
) {
  const parsed = z
    .object({
      message: z.string().trim().min(1).max(2000),
    })
    .strict()
    .safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(400, "Message is required");
  }

  res.status(201).json({
    success: true,
    data: await createWorkerMessage(req.user!, {
      message: parsed.data.message,
    }),
    message: "Message sent successfully.",
  });
}

export async function messages(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await workerMessages(req.user!),
  });
}

export async function deleteMessage(
  req: Request,
  res: Response,
) {
  const data = await deleteWorkerMessage(
    req.user!,
    String(req.params.id),
  );

  res.json({
    success: true,
    data,
    message: "Message deleted successfully.",
  });
}

export async function editProfile(req: Request, res: Response) {
  res.json({
    success: true,
    data: await updateWorkerProfile(req.user!, req.body),
    message: "Profile updated.",
  });
}

export async function wallet(req: Request, res: Response) {
  res.json({
    success: true,
    data: await workerWallet(req.user!),
  });
}

export async function heartbeat(
  req: Request,
  res: Response,
) {
  res.json({
    success: true,
    data: await updateWorkerPresence(req.user!),
  });
}

export { CALL_OUTCOMES };