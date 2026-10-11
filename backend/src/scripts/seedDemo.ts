import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { AgencyModel } from "../models/Agency.js";
import { CallModel, type CallOutcome } from "../models/Call.js";
import { FollowUpModel, type FollowUpStatus } from "../models/FollowUp.js";
import { LeadModel, type LeadStatus } from "../models/Lead.js";
import { UserModel } from "../models/User.js";

const demo = {
  admin: { name: "NexCall Admin", email: "admin@demo.nexcall.com", role: "admin" as const },
  owner: { name: "Rahul Sharma", email: "agency@demo.nexcall.com", role: "agency" as const },
  worker: { name: "Priya Mehta", email: "worker@demo.nexcall.com", role: "telecaller" as const },
  agencyName: "Acme Agency",
};

async function assertCompatibleAccount(email: string, role: "admin" | "agency" | "telecaller") {
  const existing = await UserModel.findOne({ email }).select("role").lean();
  if (existing && existing.role !== role) {
    throw new Error(`${email} already exists with a different role; no demo data was changed`);
  }
}

async function seedDemo() {
  if (env.NODE_ENV === "production") {
    throw new Error("Demo accounts cannot be seeded in production");
  }
  if (!env.DEMO_PASSWORD) {
    throw new Error("Set DEMO_PASSWORD in backend/.env before seeding demo accounts");
  }

  await connectDatabase();
  await Promise.all([
    assertCompatibleAccount(demo.admin.email, demo.admin.role),
    assertCompatibleAccount(demo.owner.email, demo.owner.role),
    assertCompatibleAccount(demo.worker.email, demo.worker.role),
  ]);

  const passwordHash = await bcrypt.hash(env.DEMO_PASSWORD, 12);
  const existingOwner = await UserModel.findOne({ email: demo.owner.email }).select("_id agencyId");
  const ownerId = existingOwner?._id ?? new Types.ObjectId();
  const existingAgency = existingOwner?.agencyId
    ? await AgencyModel.findById(existingOwner.agencyId)
    : await AgencyModel.findOne({ name: demo.agencyName });
  const agencyId = existingAgency?._id ?? new Types.ObjectId();

  await AgencyModel.findOneAndUpdate(
    { _id: agencyId },
    {
      $set: { name: demo.agencyName, ownerId, status: "active" },
      $setOnInsert: { subscriptionPlanId: null },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await UserModel.findOneAndUpdate(
    { email: demo.owner.email },
    {
      $set: { ...demo.owner, passwordHash, agencyId, status: "active" },
      $setOnInsert: { _id: ownerId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await UserModel.findOneAndUpdate(
    { email: demo.worker.email },
    { $set: { ...demo.worker, passwordHash, agencyId, status: "active" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await UserModel.findOneAndUpdate(
    { email: demo.admin.email },
    { $set: { ...demo.admin, passwordHash, agencyId: null, status: "active" } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const demoWorker = await UserModel.findOne({ email: demo.worker.email }).select("_id").lean();
  if (!demoWorker) throw new Error("Demo worker could not be prepared");
  const leads: Array<{ demoKey: string; name: string; phone: string; email: string; company: string; source: string; status: LeadStatus; assignedTo: Types.ObjectId | null; notes: string }> = [
    { demoKey: "raj-mehta", name: "Raj Mehta", phone: "+91 98765 41001", email: "raj@example.com", company: "Orbit Labs", source: "Website", status: "interested", assignedTo: demoWorker._id, notes: "Interested in the premium package." },
    { demoKey: "sneha-patel", name: "Sneha Patel", phone: "+91 98765 41002", email: "sneha@example.com", company: "Kindred Co.", source: "Referral", status: "new", assignedTo: null, notes: "Requested an introductory call." },
    { demoKey: "amit-shah", name: "Amit Shah", phone: "+91 98765 41003", email: "amit@example.com", company: "Mesa Studio", source: "Campaign", status: "follow_up", assignedTo: demoWorker._id, notes: "Follow up next week." },
    { demoKey: "neha-verma", name: "Neha Verma", phone: "+91 98765 41004", email: "neha@example.com", company: "Northstar Media", source: "Website", status: "converted", assignedTo: demoWorker._id, notes: "Converted to the demo plan." },
  ];
  await Promise.all(leads.map((lead) => LeadModel.findOneAndUpdate(
    { agencyId, demoKey: lead.demoKey },
    { $set: { ...lead, agencyId, archived: false } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )));

  const demoLeads = await LeadModel.find({ agencyId, demoKey: { $in: leads.map((lead) => lead.demoKey) } }).select("_id demoKey").lean();
  const leadByKey = new Map(demoLeads.map((lead) => [lead.demoKey, lead._id]));
  const now = Date.now();
  const calls: Array<{ demoKey: string; leadKey: string; outcome: CallOutcome; durationSeconds: number; notes: string; startedAt: Date; nextFollowUpAt?: Date }> = [
    { demoKey: "raj-interested", leadKey: "raj-mehta", outcome: "interested", durationSeconds: 151, notes: "Asked to call tomorrow.", startedAt: new Date(now - 45 * 60 * 1000) },
    { demoKey: "sneha-no-answer", leadKey: "sneha-patel", outcome: "no_answer", durationSeconds: 0, notes: "No response.", startedAt: new Date(now - 3 * 60 * 60 * 1000) },
    { demoKey: "amit-callback", leadKey: "amit-shah", outcome: "callback_requested", durationSeconds: 102, notes: "Requested a callback next week.", startedAt: new Date(now - 24 * 60 * 60 * 1000), nextFollowUpAt: new Date(now + 7 * 24 * 60 * 60 * 1000) },
    { demoKey: "neha-converted", leadKey: "neha-verma", outcome: "converted", durationSeconds: 312, notes: "Confirmed conversion.", startedAt: new Date(now - 2 * 24 * 60 * 60 * 1000) },
  ];
  await Promise.all(calls.map((call) => {
    const leadId = leadByKey.get(call.leadKey);
    if (!leadId) throw new Error(`Demo lead missing: ${call.leadKey}`);
    const values = { demoKey: call.demoKey, outcome: call.outcome, durationSeconds: call.durationSeconds, notes: call.notes, startedAt: call.startedAt, ...(call.nextFollowUpAt ? { nextFollowUpAt: call.nextFollowUpAt } : {}) };
    return CallModel.findOneAndUpdate({ agencyId, demoKey: call.demoKey }, { $set: { ...values, agencyId, leadId, telecallerId: demoWorker._id } }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }));

  const followUps:Array<{demoKey:string;leadKey:string;title:string;offsetHours:number;status:FollowUpStatus;notes:string}>=[{demoKey:"raj-upcoming",leadKey:"raj-mehta",title:"Follow up with Raj Mehta",offsetHours:24,status:"pending",notes:"Interested in premium plan."},{demoKey:"sneha-today",leadKey:"sneha-patel",title:"Follow up with Sneha Patel",offsetHours:2,status:"pending",notes:"Introductory callback."},{demoKey:"amit-completed",leadKey:"amit-shah",title:"Follow up with Amit Shah",offsetHours:-24,status:"completed",notes:"Follow-up completed."},{demoKey:"neha-overdue",leadKey:"neha-verma",title:"Follow up with Neha Verma",offsetHours:-4,status:"pending",notes:"Overdue demo task."}];
  await Promise.all(followUps.map(item=>{const leadId=leadByKey.get(item.leadKey);if(!leadId)throw new Error(`Demo lead missing: ${item.leadKey}`);return FollowUpModel.findOneAndUpdate({agencyId,demoKey:item.demoKey},{$set:{agencyId,leadId,telecallerId:demoWorker._id,callId:null,title:item.title,scheduledAt:new Date(now+item.offsetHours*60*60*1000),status:item.status,notes:item.notes,completedAt:item.status==="completed"?new Date(now-20*60*60*1000):null}},{upsert:true,new:true,setDefaultsOnInsert:true});}));

  console.info("Demo accounts, leads, calls, and follow-ups are ready.");
}

seedDemo()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Demo seed failed");
    process.exitCode = 1;
  })
  .finally(() => void disconnectDatabase());
