import type { SafeUser, UserRole, UserStatus } from "../types/domain.js";

export function toSafeUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  username?: string;
  phone?: string;
  role: string;
  agencyId?: { toString(): string } | null;
  status: string;
  lastSeenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    ...(user.username ? { username: user.username } : {}),
    ...(user.phone ? { phone: user.phone } : {}),
    role: user.role as UserRole,
    agencyId: user.agencyId?.toString() ?? null,
    status: user.status as UserStatus,
    lastSeenAt: user.lastSeenAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
