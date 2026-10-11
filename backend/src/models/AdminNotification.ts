
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const adminNotificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "agency_registered",
        "agency_suspended",
        "agency_activated",
        "plan_assigned",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    agencyId: {
      type: Schema.Types.ObjectId,
      ref: "Agency",
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

adminNotificationSchema.index({
  createdAt: -1,
});

export type AdminNotification =
  InferSchemaType<typeof adminNotificationSchema>;

export const AdminNotificationModel: Model<AdminNotification> =
  (models.AdminNotification as Model<AdminNotification> | undefined) ??
  model<AdminNotification>(
    "AdminNotification",
    adminNotificationSchema,
  );
