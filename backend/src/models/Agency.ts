import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const agencySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    status: { type: String, enum: ["active", "suspended"], default: "active", required: true, index: true },
    subscriptionPlanId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", default: null, index: true },
  },
  { timestamps: true, versionKey: false },
);
export type Agency = InferSchemaType<typeof agencySchema>;
export const AgencyModel: Model<Agency> = (models.Agency as Model<Agency> | undefined) ?? model<Agency>("Agency", agencySchema);
