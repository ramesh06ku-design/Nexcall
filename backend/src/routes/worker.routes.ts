import { Router } from "express";
import { z } from "zod";
import {
  CALL_OUTCOMES,
  calls,
  dashboard,
  editFollowUp,
  editLead,
  editProfile,
  heartbeat,
  createFollowUp,
  followUps,
  leadProjects,
  lead,
  leads,
  logCall,
  wallet,
  createMessage,
  messages,
  deleteMessage,
} from "../controllers/worker.controller.js";
import { LEAD_STATUSES } from "../models/Lead.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
const router = Router();
router.use(authenticate, authorize("telecaller"));
router.get("/", asyncHandler(dashboard)); router.get("/dashboard", asyncHandler(dashboard)); router.get("/wallet", asyncHandler(wallet));
router.get(
  "/lead-projects",
  asyncHandler(leadProjects),
);
router.get("/leads", asyncHandler(leads)); router.get("/leads/:id", asyncHandler(lead));
router.patch("/leads/:id", validateBody(z.object({ status: z.enum(LEAD_STATUSES).optional(), notes: z.string().trim().max(2000).optional() }).strict()), asyncHandler(editLead));
router.get("/calls", asyncHandler(calls));
router.post("/calls", validateBody(z.object({ leadId: z.string(), startedAt: z.iso.datetime({ local: true }), durationSeconds: z.number().int().min(0).max(86400), outcome: z.enum(CALL_OUTCOMES), notes: z.string().max(2000).optional(), nextFollowUpAt: z.iso.datetime({ local: true }).optional() }).strict()), asyncHandler(logCall));
router.post(
  "/follow-ups",
  asyncHandler(createFollowUp),
);
router.get("/follow-ups", asyncHandler(followUps));
router.patch("/follow-ups/:id", validateBody(z.discriminatedUnion("action", [z.object({ action: z.literal("complete") }), z.object({ action: z.literal("reschedule"), scheduledAt: z.iso.datetime({ local: true }) })])), asyncHandler(editFollowUp));
router.get(
  "/messages",
  asyncHandler(messages),
);

router.post(
  "/messages",
  asyncHandler(createMessage),
);

router.delete(
  "/messages/:id",
  asyncHandler(deleteMessage),
);
router.post(
  "/heartbeat",
  asyncHandler(heartbeat),
);
router.patch("/profile", validateBody(z.object({ name: z.string().trim().min(2).max(100).optional(), phone: z.string().trim().min(7).max(25).optional() }).strict()), asyncHandler(editProfile));
export default router;
