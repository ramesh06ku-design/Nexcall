import { Router } from "express";
import { z } from "zod";
import { createTelecallerController, getTelecallerController, listTelecallersController, updateTelecallerController } from "../controllers/agency.controller.js";
import {
  archiveLeadController,
  createLeadController,
  deleteLeadController,
  deleteLeadProjectController,
  deleteLeadsController,
  getLeadController,
  importLeadsController,
  listLeadProjectsController,
  listLeadsController,
  updateLeadController,
  updateLeadProjectAssignmentsController,
} from "../controllers/agency.controller.js";
import { createCallController,getCallController,listCallsController,listLeadCallsController } from "../controllers/agency.controller.js";
import { createFollowUpController,getFollowUpController,listFollowUpsController,updateFollowUpController } from "../controllers/agency.controller.js";
import { getAnalyticsController } from "../controllers/agency.controller.js";
import { createFinanceController, deleteFinanceController, getFinanceController, listFinanceController, updateFinanceController } from "../controllers/agency.controller.js";
import { CALL_OUTCOMES } from "../models/Call.js";
import { LEAD_STATUSES } from "../models/Lead.js";
import { foundationController } from "../controllers/foundation.controller.js";
import { updateAgencySettingsController } from "../controllers/agency.controller.js";
import {
  listMessagesController,
  readMessageController,
  deleteMessageController,
} from "../controllers/agency.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTelecallerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email().transform((value) => value.toLowerCase()),
    username: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .regex(/^[a-zA-Z0-9._-]+$/)
      .optional(),
    phone: z.string().trim().min(7).max(25).optional(),
    password: z.string().min(8).max(72),
  })
  .strict();

const updateAgencySettingsSchema = z
  .object({
    agencyName: z.string().trim().min(2).max(120),
    ownerName: z.string().trim().min(2).max(100),
    email: z.email().transform((value) => value.toLowerCase()),
  })
  .strict();
const router = Router();
const updateTelecallerSchema = z.object({ name: z.string().trim().min(2).max(100).optional(), phone: z.string().trim().max(25).refine((value) => value === "" || value.length >= 7).optional(), status: z.enum(["active", "inactive"]).optional() }).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");
const phone = z.string().trim().min(7).max(30).regex(/^\+?[0-9 ()-]+$/, "Enter a valid phone number");
const leadFields = {
  name: z.string().trim().min(2).max(120),
  phone,
  requirement: z.string().trim().min(2).max(500),
  email: z.union([z.email(), z.literal("")]).optional(),
  company: z.string().trim().max(120).optional(),
  source: z.string().trim().max(80).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  assignedTo: z.union([z.string(), z.null()]).optional(),
  notes: z.string().trim().max(2000).optional()
};
const createLeadSchema=z.object(leadFields).strict();
const updateLeadSchema=z.object({ 
  name:leadFields.name.optional(), 
  phone:phone.optional(), 
  requirement: leadFields.requirement.optional(),
  email:leadFields.email, 
  company:leadFields.company, 
  source:leadFields.source, 
  status:leadFields.status, 
  assignedTo:leadFields.assignedTo, 
  notes:leadFields.notes 
})
.strict()
.refine(
  v=>Object.keys(v).length>0,
  "At least one field is required"
);
const importLeadRowSchema = z
  .object({
    rowNumber: z.number().int().min(1),
    name: z.string().max(120).optional(),
    phone: z.string().max(30).optional(),
    requirement: z.string().max(500).optional(),
    email: z.string().max(160).optional(),
    company: z.string().max(120).optional(),
    source: z.string().max(80).optional(),
    status: z.string().max(40).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

const importLeadsSchema = z
  .object({
    projectName: z.string().trim().min(2).max(160),
    rows: z.array(importLeadRowSchema).min(1).max(500),
    defaultStatus: z.enum(LEAD_STATUSES).default("new"),
    assignedTo: z.union([z.string(), z.null()]).optional(),
  })
  .strict();

  const assignLeadProjectSchema = z
  .object({
    workerIds: z
      .array(z.string().trim().min(1))
      .max(100)
      .default([]),
  })
  .strict();
const createCallSchema=z.object({leadId:z.string().min(1,"Please select a lead."),telecallerId:z.string().min(1,"Please select a telecaller."),startedAt:z.iso.datetime({local:true}),durationSeconds:z.coerce.number().int().min(0).max(86400),outcome:z.enum(CALL_OUTCOMES),notes:z.string().trim().max(2000).optional(),nextFollowUpAt:z.iso.datetime({local:true}).optional()}).strict().superRefine((value,ctx)=>{if(value.outcome==="callback_requested"&&!value.nextFollowUpAt)ctx.addIssue({code:"custom",path:["nextFollowUpAt"],message:"Next follow-up date is required"});});
const money=z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const financeFields={clientName:z.string().trim().min(2).max(160),workerId:z.string().min(1),status:z.enum(["opened","closed","cancelled"]),totalAgreementAmountPaise:money.min(1),workerEarningPaise:money,message:z.string().trim().max(2000).optional()};
const createFinanceSchema=z.object({...financeFields,status:financeFields.status.optional()}).strict();
const updateFinanceSchema=z.object({clientName:financeFields.clientName.optional(),workerId:financeFields.workerId.optional(),status:financeFields.status.optional(),totalAgreementAmountPaise:financeFields.totalAgreementAmountPaise.optional(),workerEarningPaise:financeFields.workerEarningPaise.optional(),message:financeFields.message}).strict().refine(value=>Object.keys(value).length>0,"At least one field is required");
router.use(authenticate, authorize("agency"));
router.get("/", foundationController("agency"));
router.patch(
  "/settings",
  validateBody(updateAgencySettingsSchema),
  asyncHandler(updateAgencySettingsController),
);
router.get(
  "/messages",
  asyncHandler(listMessagesController),
);

router.get(
  "/messages/:id",
  asyncHandler(readMessageController),
);

router.delete(
  "/messages/:id",
  asyncHandler(deleteMessageController),
);
router.get("/analytics",asyncHandler(getAnalyticsController));
router.get("/finance",asyncHandler(listFinanceController));
router.post("/finance",validateBody(createFinanceSchema),asyncHandler(createFinanceController));
router.get("/finance/:id",asyncHandler(getFinanceController));
router.patch("/finance/:id",validateBody(updateFinanceSchema),asyncHandler(updateFinanceController));
router.delete("/finance/:id",asyncHandler(deleteFinanceController));
router.get("/telecallers", asyncHandler(listTelecallersController));
router.post(
  "/telecallers",
  validateBody(createTelecallerSchema),
  asyncHandler(createTelecallerController),
);
router.get("/telecallers/:id", asyncHandler(getTelecallerController));
router.patch("/telecallers/:id", validateBody(updateTelecallerSchema), asyncHandler(updateTelecallerController));
router.patch("/telecallers/:id/status", validateBody(z.object({ status: z.enum(["active", "inactive"]) }).strict()), asyncHandler(updateTelecallerController));
router.get(
  "/lead-projects",
  asyncHandler(listLeadProjectsController),
);
router.patch(
  "/lead-projects/:id/assignments",
  validateBody(assignLeadProjectSchema),
  asyncHandler(updateLeadProjectAssignmentsController),
);
router.delete(
  "/lead-projects/:id",
  asyncHandler(deleteLeadProjectController),
);
router.get("/leads",asyncHandler(listLeadsController));
router.post("/leads",validateBody(createLeadSchema),asyncHandler(createLeadController));
router.post("/leads/import",validateBody(importLeadsSchema),asyncHandler(importLeadsController));
router.get("/leads/:id",asyncHandler(getLeadController));
router.patch("/leads/:id",validateBody(updateLeadSchema),asyncHandler(updateLeadController));
router.patch("/leads/:id/archive",asyncHandler(archiveLeadController));
router.delete(
  "/leads/bulk",
  asyncHandler(deleteLeadsController),
);
router.delete(
  "/leads/:id",
  asyncHandler(deleteLeadController),
);
router.get("/leads/:id/calls",asyncHandler(listLeadCallsController));
router.get("/calls",asyncHandler(listCallsController));
router.post("/calls",validateBody(createCallSchema),asyncHandler(createCallController));
router.get("/calls/:id",asyncHandler(getCallController));
const followUpSchema=z.object({leadId:z.string().min(1),telecallerId:z.string().min(1),callId:z.string().optional(),title:z.string().trim().max(160).optional(),scheduledAt:z.iso.datetime({local:true}),notes:z.string().trim().max(2000).optional()}).strict();
const followUpActionSchema=z.discriminatedUnion("action",[z.object({action:z.literal("complete")}),z.object({action:z.literal("cancel")}),z.object({action:z.literal("reschedule"),scheduledAt:z.iso.datetime({local:true}),notes:z.string().trim().max(2000).optional()})]);
router.get("/follow-ups",asyncHandler(listFollowUpsController));
router.post("/follow-ups",validateBody(followUpSchema),asyncHandler(createFollowUpController));
router.get("/follow-ups/:id",asyncHandler(getFollowUpController));
router.patch("/follow-ups/:id",validateBody(followUpActionSchema),asyncHandler(updateFollowUpController));

export default router;
