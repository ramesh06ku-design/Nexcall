import { Types } from "mongoose";
import { FinanceEntryModel, type FinanceStatus } from "../models/FinanceEntry.js";
import { UserModel } from "../models/User.js";
import type { SafeUser } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";

export interface FinanceInput { clientName: string; workerId: string; status?: FinanceStatus; totalAgreementAmountPaise: number; workerEarningPaise: number; message?: string; }
function agencyId(user: SafeUser) { if (user.role !== "agency" || !user.agencyId) throw new AppError(403, "An active agency account is required"); return new Types.ObjectId(user.agencyId); }
function validId(id: string, label = "Finance entry") { if (!Types.ObjectId.isValid(id)) throw new AppError(404, `${label} not found`); }
async function assertWorker(tenant: Types.ObjectId, workerId: string) { validId(workerId, "Telecaller"); const worker = await UserModel.exists({ _id: workerId, agencyId: tenant, role: "telecaller" }); if (!worker) throw new AppError(400, "Select a telecaller from your agency"); }

export async function createFinance(user: SafeUser, input: FinanceInput) {
  const tenant = agencyId(user); await assertWorker(tenant, input.workerId);
  const status = input.status ?? "opened";
  return (await FinanceEntryModel.create({ ...input, agencyId: tenant, status, closedAt: status === "closed" ? new Date() : null })).populate("workerId", "name email status");
}
export async function listFinance(user: SafeUser, query: { search?: string | undefined; workerId?: string | undefined; status?: FinanceStatus | undefined; page: number; limit: number }) {
  const tenant = agencyId(user); const filter: Record<string, unknown> = { agencyId: tenant };
  if (query.workerId) { validId(query.workerId, "Telecaller"); filter.workerId = query.workerId; }
  if (query.status) filter.status = query.status;
  if (query.search) filter.clientName = { $regex: query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  const [items, total, totals] = await Promise.all([
    FinanceEntryModel.find(filter).populate("workerId", "name email status").sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit),
    FinanceEntryModel.countDocuments(filter),
    FinanceEntryModel.aggregate<{ _id: FinanceStatus; count: number; agreement: number; earning: number }>([{ $match: { agencyId: tenant } }, { $group: { _id: "$status", count: { $sum: 1 }, agreement: { $sum: "$totalAgreementAmountPaise" }, earning: { $sum: "$workerEarningPaise" } } }]),
  ]);
  return { items, page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)), summary: { totalAgreementAmountPaise: totals.reduce((s, r) => s + (r._id !== "cancelled" ? r.agreement : 0), 0), workerEarningsPaise: totals.reduce((s, r) => s + (r._id !== "cancelled" ? r.earning : 0), 0), opened: totals.find(r => r._id === "opened")?.count ?? 0, closed: totals.find(r => r._id === "closed")?.count ?? 0, cancelled: totals.find(r => r._id === "cancelled")?.count ?? 0 } };
}
export async function getFinance(user: SafeUser, id: string) { validId(id); const item = await FinanceEntryModel.findOne({ _id: id, agencyId: agencyId(user) }).populate("workerId", "name email status"); if (!item) throw new AppError(404, "Finance entry not found"); return item; }
export async function updateFinance(user: SafeUser, id: string, input: Partial<FinanceInput>) {
  validId(id); const tenant = agencyId(user); const current = await FinanceEntryModel.findOne({ _id: id, agencyId: tenant }); if (!current) throw new AppError(404, "Finance entry not found");
  if (input.workerId) await assertWorker(tenant, input.workerId);
  const next = input.status ?? current.status;
  if (current.status === "closed" && next !== "closed") throw new AppError(409, "Closed deals cannot be reopened or cancelled");
  if (current.status === "cancelled" && next !== "cancelled") throw new AppError(409, "Cancelled deals cannot be reopened");
  if (current.status === "closed" && (input.workerId !== undefined || input.workerEarningPaise !== undefined)) throw new AppError(409, "Worker and earning cannot be changed after closure");
  Object.assign(current, input, { closedAt: current.status !== "closed" && next === "closed" ? new Date() : current.closedAt, status: next });
  await current.save(); return current.populate("workerId", "name email status");
}
export async function deleteFinance(user: SafeUser, id: string) { validId(id); const item = await FinanceEntryModel.findOne({ _id: id, agencyId: agencyId(user) }); if (!item) throw new AppError(404, "Finance entry not found"); if (item.status === "closed") throw new AppError(409, "Closed financial records cannot be deleted"); await item.deleteOne(); return { id }; }
export async function workerWallet(user: SafeUser) {
  if (user.role !== "telecaller" || !user.agencyId) throw new AppError(403, "A telecaller account is required");
  const match = { agencyId: new Types.ObjectId(user.agencyId), workerId: new Types.ObjectId(user.id) };
  const [items, sums] = await Promise.all([
    FinanceEntryModel.find(match).select("clientName status workerEarningPaise message closedAt createdAt updatedAt").sort({ createdAt: -1 }).lean(),
    FinanceEntryModel.aggregate<{ _id: FinanceStatus; amount: number }>([{ $match: match }, { $group: { _id: "$status", amount: { $sum: "$workerEarningPaise" } } }]),
  ]);
  const pendingEarningsPaise = sums.find(x => x._id === "opened")?.amount ?? 0; const totalEarnedPaise = sums.find(x => x._id === "closed")?.amount ?? 0;
  return { summary: { pendingEarningsPaise, availableBalancePaise: totalEarnedPaise, totalEarnedPaise }, items: items.map(({ _id, ...item }) => ({ id: String(_id), ...item })) };
}
