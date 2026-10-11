import { Schema, Types, model, models, type Model } from "mongoose";

export const FINANCE_STATUSES = ["opened", "closed", "cancelled"] as const;
export type FinanceStatus = (typeof FINANCE_STATUSES)[number];

export interface FinanceEntry {
  agencyId: Types.ObjectId;
  workerId: Types.ObjectId;
  clientName: string;
  status: FinanceStatus;
  totalAgreementAmountPaise: number;
  workerEarningPaise: number;
  message?: string;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<FinanceEntry>({
  agencyId: { type: Schema.Types.ObjectId, ref: "Agency", required: true, index: true },
  workerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  clientName: { type: String, required: true, trim: true, maxlength: 160 },
  status: { type: String, enum: FINANCE_STATUSES, default: "opened", required: true },
  totalAgreementAmountPaise: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  workerEarningPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  message: { type: String, trim: true, maxlength: 2000 },
  closedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false, toJSON: { transform: (_doc, result) => { const value = result as Record<string, unknown>; value.id = String(value._id); delete value._id; return value; } } });

schema.index({ agencyId: 1, status: 1, createdAt: -1 });
schema.index({ agencyId: 1, workerId: 1, status: 1, createdAt: -1 });

export const FinanceEntryModel: Model<FinanceEntry> =
  (models.FinanceEntry as Model<FinanceEntry> | undefined) ?? model<FinanceEntry>("FinanceEntry", schema);
