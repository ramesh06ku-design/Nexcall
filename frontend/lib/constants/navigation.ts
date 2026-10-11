import { BarChart3, Bell, Building2, CalendarClock, CircleDollarSign, LayoutDashboard, MessageSquare, Settings, UserRound, Users2 } from "lucide-react";

export const adminNavigation = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }, { label: "Agencies", href: "/admin/agencies", icon: Building2 }, { label: "Plans", href: "/admin/plans", icon: CircleDollarSign }, { label: "Analytics", href: "/admin/analytics", icon: BarChart3 }, { label: "Notifications", href: "/admin/notifications", icon: Bell }, { label: "Settings", href: "/admin/settings", icon: Settings },
];
export const agencyNavigation = [
  { label: "Dashboard", href: "/agency/dashboard", icon: LayoutDashboard }, { label: "Telecallers", href: "/agency/telecallers", icon: Users2 }, { label: "Leads", href: "/agency/leads", icon: UserRound }, { label: "Finance", href: "/agency/finance", icon: CircleDollarSign }, 
  { label: "Follow-ups", href: "/agency/followups", icon: CalendarClock }, { label: "Messages", href: "/agency/messages", icon: MessageSquare }, { label: "Analytics", href: "/agency/analytics", icon: BarChart3 },
  { label: "Settings", href: "/agency/settings", icon: Settings },
];
export const workerNavigation = [
  { label: "Dashboard", href: "/worker/dashboard", icon: LayoutDashboard }, { label: "My Leads", href: "/worker/leads", icon: UserRound }, 
  { label: "Follow-ups", href: "/worker/followups", icon: CalendarClock }, { label: "Messages", href: "/worker/messages", icon: MessageSquare }, { label: "Wallet", href: "/worker/wallet", icon: CircleDollarSign }, 
  { label: "Profile", href: "/worker/profile", icon: Settings },
];
