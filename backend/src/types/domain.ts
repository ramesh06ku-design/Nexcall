export const USER_ROLES = ["admin", "agency", "telecaller"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const USER_STATUSES = ["active", "inactive", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export type BillingInterval = "monthly" | "yearly";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  role: UserRole;
  agencyId: string | null;
  status: UserStatus;
  lastSeenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeAgencySummary {
  id: string;
  name: string;
  status: "active" | "suspended";
}

export interface AuthenticatedUser extends SafeUser {
  agency?: SafeAgencySummary;
}
