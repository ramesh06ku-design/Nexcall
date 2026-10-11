import { Schema, Types, model, models, type HydratedDocument, type Model } from "mongoose";
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from "../types/domain.js";

export interface User {
  name: string;
  email: string;
  username?: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  agencyId: Types.ObjectId | null;
  status: UserStatus;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true, minlength: 3, maxlength: 40 },
    phone: { type: String, trim: true, maxlength: 25 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true, index: true },
    agencyId: { type: Schema.Types.ObjectId, ref: "Agency", default: null, index: true },
    status: { type: String, enum: USER_STATUSES, default: "active", required: true },
    lastSeenAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_document, returned) => {
        const sanitized = returned as Record<string, unknown>;
        delete sanitized.passwordHash;
        return sanitized;
      },
    },
  },
);
userSchema.index({ agencyId: 1, role: 1, status: 1, createdAt: -1 });
export type UserDocument = HydratedDocument<User>;
export const UserModel: Model<User> = (models.User as Model<User> | undefined) ?? model<User>("User", userSchema);
