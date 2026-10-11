export type UserRole = "admin" | "agency" | "telecaller";

export type UserStatus =
  | "active"
  | "inactive"
  | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  role: UserRole;
  agencyId: string | null;
  status: UserStatus;
  agency?: Pick<Agency, "id" | "name" | "status">;
  createdAt: string;
  updatedAt: string;
}

export interface Agency {
  id: string;
  name: string;
  ownerId: string;
  status: "active" | "suspended";
  subscriptionPlanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingInterval: "monthly" | "yearly";
  description: string;
  limits: {
    telecallers: number;
    leads: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export type TelecallerStatus = "active" | "inactive";

export type Telecaller = User & {
  role: "telecaller";
  status: TelecallerStatus;
  lastSeenAt?: string | null;
};

export interface PaginatedTelecallers {
  items: Telecaller[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
}

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "converted"
  | "not_interested"
  | "lost";

export interface Lead {
  id: string;
  agencyId: string;
  name: string;
  phone: string;
  requirement?: string;
  email?: string;
  company?: string;
  source?: string;
  status: LeadStatus;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  } | null;
  notes?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadProject {
  id: string;
  name: string;
  leadCount: number;
  createdAt: string;

  assignedWorkerIds: string[];

  assignedWorkers: {
    id: string;
    name: string;
    email: string;
    status: TelecallerStatus;
  }[];
}

export interface PaginatedLeads {
  items: Lead[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    total: number;
    new: number;
    interested: number;
    converted: number;
  };
}

export type CallOutcome =
  | "answered"
  | "no_answer"
  | "busy"
  | "callback_requested"
  | "interested"
  | "not_interested"
  | "wrong_number"
  | "converted";

export interface CallLog {
  id: string;
  agencyId: string;
  leadId: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
  };
  telecallerId: {
    _id: string;
    name: string;
    email?: string;
  };
  startedAt: string;
  durationSeconds: number;
  outcome: CallOutcome;
  notes?: string;
  nextFollowUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCalls {
  items: CallLog[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    total: number;
    answered: number;
    noAnswer: number;
    interested: number;
  };
}

export type FollowUpStatus =
  | "pending"
  | "completed"
  | "cancelled";

export interface FollowUp {
  id: string;
  leadId: {
    _id: string;
    name: string;
    phone: string;
  };
  telecallerId: {
    _id: string;
    name: string;
    email?: string;
  };
  callId?: string | null;
  title: string;
  scheduledAt: string;
  status: FollowUpStatus;
  notes?: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedFollowUps {
  items: FollowUp[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    today: number;
    overdue: number;
    upcoming: number;
    completed: number;
  };
}

export interface WorkerDashboardData {
  stats: {
    assignedLeadCount: number;
    activeLeadCount: number;
    todayFollowUps: number;
    overdueFollowUps: number;
    pendingEarningsPaise: number;
    availableBalancePaise: number;
  };
  todayFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
  recentLeads: Lead[];
}

export type AnalyticsRange =
  | "today"
  | "7d"
  | "30d";

export interface AgencyAnalytics {
  range: AnalyticsRange;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalLeads: number;
    newLeads: number;
    interestedLeads: number;
    convertedLeads: number;
    activeTelecallers: number;
    followUpsDue: number;
    overdueFollowUps: number;
    totalFinanceDeals: number;
    openDeals: number;
    closedDeals: number;
    cancelledDeals: number;
    totalAgreementValuePaise: number;
    totalWorkerEarningsPaise: number;
    pendingWorkerEarningsPaise: number;
  };
  leadStatusBreakdown: {
    status: LeadStatus;
    count: number;
  }[];
  financeActivity: {
    date: string;
    opened: number;
    closed: number;
  }[];
  dealStatusBreakdown: {
    status: FinanceStatus;
    count: number;
  }[];
  telecallerActivity: {
    id: string;
    name: string;
    email: string;
    status: TelecallerStatus;
    calls: number;
    answered: number;
    interested: number;
    converted: number;
    followUpsCompleted: number;
  }[];
  followUps: {
    dueToday: number;
    overdue: number;
    completed: number;
  };
}

export type FinanceStatus =
  | "opened"
  | "closed"
  | "cancelled";

export interface FinanceEntry {
  id: string;
  clientName: string;
  workerId: {
    _id: string;
    name: string;
    email: string;
    status: TelecallerStatus;
  };
  status: FinanceStatus;
  totalAgreementAmountPaise: number;
  workerEarningPaise: number;
  message?: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedFinance {
  items: FinanceEntry[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  summary: {
    totalAgreementAmountPaise: number;
    workerEarningsPaise: number;
    opened: number;
    closed: number;
    cancelled: number;
  };
}

export interface WalletEntry {
  id: string;
  clientName: string;
  status: FinanceStatus;
  workerEarningPaise: number;
  message?: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerWallet {
  summary: {
    pendingEarningsPaise: number;
    availableBalancePaise: number;
    totalEarnedPaise: number;
  };
  items: WalletEntry[];
}