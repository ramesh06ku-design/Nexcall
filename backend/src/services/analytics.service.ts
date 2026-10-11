import { Types } from "mongoose";
import { CallModel, CALL_OUTCOMES } from "../models/Call.js";
import { FollowUpModel } from "../models/FollowUp.js";
import { LeadModel, LEAD_STATUSES } from "../models/Lead.js";
import { UserModel } from "../models/User.js";
import { FinanceEntryModel } from "../models/FinanceEntry.js";
import type { SafeUser } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";

export type AnalyticsRange = "today" | "7d" | "30d";

export function analyticsTenantId(user: SafeUser) {
  if (user.role !== "agency" || !user.agencyId) throw new AppError(403, "An active agency account is required");
  return new Types.ObjectId(user.agencyId);
}

export function analyticsDateRange(range: AnalyticsRange, now = new Date()) {
  const end = new Date(now);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "7d") start.setDate(start.getDate() - 6);
  if (range === "30d") start.setDate(start.getDate() - 29);
  return { start, end };
}

export function answerRate(answered: number, total: number) { return total ? Math.round((answered / total) * 1000) / 10 : 0; }

type CountRow = { _id: string; count: number };
type ActivityRow = { _id: string; count: number };
type CallerRow = { _id: Types.ObjectId; calls: number; answered: number; interested: number; converted: number };
type FollowUpCallerRow = { _id: Types.ObjectId; completed: number };

export async function getAgencyAnalytics(user: SafeUser, range: AnalyticsRange, now = new Date()) {
  const agencyId = analyticsTenantId(user);
  const { start, end } = analyticsDateRange(range, now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const callMatch = { agencyId, startedAt: { $gte: start, $lte: end } };
  const leadMatch = { agencyId, archived: false };
  const answeredOutcomes = ["answered", "interested", "converted"];

  const [leadCounts, callCounts, callActivityRows, telecallers, callerRows, followUpCallerRows, dueToday, overdue, completed, financeRows, financeActivityRows] = await Promise.all([
    LeadModel.aggregate<CountRow>([{ $match: leadMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    CallModel.aggregate<CountRow>([{ $match: callMatch }, { $group: { _id: "$outcome", count: { $sum: 1 } } }]),
    CallModel.aggregate<ActivityRow>([{ $match: callMatch }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    UserModel.find({ agencyId, role: "telecaller" }).select("name email status").sort({ name: 1 }).lean(),
    CallModel.aggregate<CallerRow>([{ $match: callMatch }, { $group: { _id: "$telecallerId", calls: { $sum: 1 }, answered: { $sum: { $cond: [{ $in: ["$outcome", answeredOutcomes] }, 1, 0] } }, interested: { $sum: { $cond: [{ $eq: ["$outcome", "interested"] }, 1, 0] } }, converted: { $sum: { $cond: [{ $eq: ["$outcome", "converted"] }, 1, 0] } } } }]),
    FollowUpModel.aggregate<FollowUpCallerRow>([{ $match: { agencyId, status: "completed", completedAt: { $gte: start, $lte: end } } }, { $group: { _id: "$telecallerId", completed: { $sum: 1 } } }]),
    FollowUpModel.countDocuments({ agencyId, status: "pending", scheduledAt: { $gte: today, $lt: tomorrow } }),
    FollowUpModel.countDocuments({ agencyId, status: "pending", scheduledAt: { $lt: now } }),
    FollowUpModel.countDocuments({ agencyId, status: "completed", completedAt: { $gte: start, $lte: end } }),
    FinanceEntryModel.aggregate<{_id:string;count:number;agreement:number;earning:number}>([{ $match:{agencyId}},{ $group:{_id:"$status",count:{$sum:1},agreement:{$sum:"$totalAgreementAmountPaise"},earning:{$sum:"$workerEarningPaise"}}}]),
    FinanceEntryModel.aggregate<{_id:string;opened:number;closed:number}>([{ $match:{agencyId,createdAt:{$gte:start,$lte:end}}},{ $group:{_id:{$dateToString:{format:"%Y-%m-%d",date:"$createdAt"}},opened:{$sum:1},closed:{$sum:{$cond:[{$eq:["$status","closed"]},1,0]}}}},{ $sort:{_id:1}}]),
  ]);

  const leadMap = new Map(leadCounts.map((row) => [row._id, row.count]));
  const callMap = new Map(callCounts.map((row) => [row._id, row.count]));
  const totalLeads = leadCounts.reduce((sum, row) => sum + row.count, 0);
  const callerMap = new Map(callerRows.map((row) => [String(row._id), row]));
  const followUpCallerMap = new Map(followUpCallerRows.map((row) => [String(row._id), row.completed]));
  const activityMap = new Map(callActivityRows.map((row) => [row._id, row.count]));
  const callActivity = [] as { date: string; calls: number }[];
  const financeActivityMap=new Map(financeActivityRows.map(row=>[row._id,row]));
  const financeActivity=[] as {date:string;opened:number;closed:number}[];
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    callActivity.push({ date: key, calls: activityMap.get(key) ?? 0 });
    const finance=financeActivityMap.get(key);financeActivity.push({date:key,opened:finance?.opened??0,closed:finance?.closed??0});
  }

  const finance=(status:string)=>financeRows.find(row=>row._id===status);
  const totalFinanceDeals=financeRows.reduce((sum,row)=>sum+row.count,0);
  const totalAgreementValuePaise=financeRows.filter(row=>row._id!=="cancelled").reduce((sum,row)=>sum+row.agreement,0);
  const totalWorkerEarningsPaise=financeRows.filter(row=>row._id!=="cancelled").reduce((sum,row)=>sum+row.earning,0);
  const pendingWorkerEarningsPaise=finance("opened")?.earning??0;

  return {
    range,
    period: { start: start.toISOString(), end: end.toISOString() },
    summary: { totalLeads, newLeads:leadMap.get("new")??0, interestedLeads: leadMap.get("interested") ?? 0, convertedLeads: leadMap.get("converted") ?? 0, activeTelecallers:telecallers.filter(x=>x.status==="active").length, followUpsDue: dueToday, overdueFollowUps: overdue,totalFinanceDeals,openDeals:finance("opened")?.count??0,closedDeals:finance("closed")?.count??0,cancelledDeals:finance("cancelled")?.count??0,totalAgreementValuePaise,totalWorkerEarningsPaise,pendingWorkerEarningsPaise },
    leadStatusBreakdown: LEAD_STATUSES.map((status) => ({ status, count: leadMap.get(status) ?? 0 })),
    callActivity,
    financeActivity,
    dealStatusBreakdown:["opened","closed","cancelled"].map(status=>({status,count:finance(status)?.count??0})),
    callOutcomes: CALL_OUTCOMES.map((outcome) => ({ outcome, count: callMap.get(outcome) ?? 0 })),
    telecallerActivity: telecallers.map((telecaller) => { const row = callerMap.get(String(telecaller._id)); return { id: String(telecaller._id), name: telecaller.name, email: telecaller.email, status: telecaller.status, calls: row?.calls ?? 0, answered: row?.answered ?? 0, interested: row?.interested ?? 0, converted: row?.converted ?? 0, followUpsCompleted: followUpCallerMap.get(String(telecaller._id)) ?? 0 }; }).sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name)),
    followUps: { dueToday, overdue, completed },
  };
}
