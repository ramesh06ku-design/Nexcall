import type { UserRole } from "@/types";
export const dashboardForRole: Record<UserRole, string> = { admin: "/admin/dashboard", agency: "/agency/dashboard", telecaller: "/worker/dashboard" };
