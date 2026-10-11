import { Types } from "mongoose";
import { CallModel, type CallOutcome } from "../models/Call.js";
import { FollowUpModel } from "../models/FollowUp.js";
import { LeadModel, type LeadStatus } from "../models/Lead.js";
import { LeadProjectModel } from "../models/LeadProject.js";
import { MessageModel } from "../models/Message.js";
import { UserModel } from "../models/User.js";
import type { SafeUser } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { toSafeUser } from "../utils/user.js";
import { workerWallet } from "./finance.service.js";

function scope(u: SafeUser) {
  if (u.role !== "telecaller" || !u.agencyId)
    throw new AppError(403, "A telecaller account is required");

  return {
    agencyId: u.agencyId,
    workerId: u.id,
  };
}

const start = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

const safe = (d: { toJSON(): unknown }) => d.toJSON();

export async function workerDashboard(u: SafeUser) {
  const { agencyId, workerId } = scope(u),
    today = start(),
    tomorrow = new Date(today);

  tomorrow.setDate(tomorrow.getDate() + 1);

  const now = new Date();

  const [
    todayFollowUps,
    overdue,
    assignedLeadCount,
    activeLeadCount,
    recentLeads,
    wallet,
  ] = await Promise.all([
    FollowUpModel.find({
      agencyId,
      telecallerId: workerId,
      status: "pending",
      scheduledAt: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate("leadId", "name phone requirement status")
      .sort({ scheduledAt: 1 })
      .limit(8),

    FollowUpModel.find({
      agencyId,
      telecallerId: workerId,
      status: "pending",
      scheduledAt: {
        $lt: now,
      },
    })
      .populate("leadId", "name phone requirement status")
      .sort({ scheduledAt: 1 })
      .limit(8),

    LeadModel.countDocuments({
      agencyId,
      assignedTo: workerId,
      archived: false,
    }),

    LeadModel.countDocuments({
      agencyId,
      assignedTo: workerId,
      archived: false,
      status: {
        $nin: ["converted", "lost", "not_interested"],
      },
    }),

    LeadModel.find({
      agencyId,
      assignedTo: workerId,
      archived: false,
    })
      .sort({ updatedAt: -1 })
      .limit(8),

    workerWallet(u),
  ]);

  return {
    stats: {
      assignedLeadCount,
      activeLeadCount,
      todayFollowUps: todayFollowUps.length,
      overdueFollowUps: overdue.length,
      pendingEarningsPaise: wallet.summary.pendingEarningsPaise,
      availableBalancePaise: wallet.summary.availableBalancePaise,
    },
    todayFollowUps: todayFollowUps.map(safe),
    overdueFollowUps: overdue.map(safe),
    recentLeads: recentLeads.map(safe),
  };
}

export async function workerLeadProjects(u: SafeUser) {
  const { agencyId, workerId } = scope(u);

  const projects = await LeadProjectModel.find({
    agencyId,
    assignedWorkerIds: workerId,
    archived: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  const items = await Promise.all(
    projects.map(async (project) => {
      const leadCount = await LeadModel.countDocuments({
        agencyId,
        projectId: project._id,
        archived: false,
      });

      return {
        id: String(project._id),
        name: project.name,
        leadCount,
        createdAt: project.createdAt,
      };
    }),
  );

  return {
    items,
  };
}

export async function workerLeads(
  u: SafeUser,
  q: {
  search?: string | undefined;
  status?: LeadStatus | undefined;
  projectId?: string | undefined;
  page: number;
  limit: number;
},
) {
  const { agencyId, workerId } = scope(u);

  const assignedProjects = await LeadProjectModel.find({
    agencyId,
    assignedWorkerIds: workerId,
    archived: false,
  })
    .select("_id")
    .lean();

  const projectIds = assignedProjects.map((project) => project._id);

let allowedProjectIds = projectIds;

if (q.projectId) {
  if (!Types.ObjectId.isValid(q.projectId)) {
    throw new AppError(400, "Invalid lead project");
  }

  const requestedProject = await LeadProjectModel.findOne({
    _id: q.projectId,
    agencyId,
    assignedWorkerIds: workerId,
    archived: false,
  })
    .select("_id")
    .lean();

  if (!requestedProject) {
    throw new AppError(404, "Lead project not found");
  }

  allowedProjectIds = [requestedProject._id];
}

const filter: Record<string, unknown> = {
  agencyId,
  projectId: {
    $in: allowedProjectIds,
  },
  archived: false,
};

  if (q.status) filter.status = q.status;

  if (q.search) {
    const x = q.search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    filter.$or = [
      "name",
      "phone",
      "email",
      "company",
      "requirement",
      "source",
    ].map((k) => ({
      [k]: {
        $regex: x,
        $options: "i",
      },
    }));
  }

  const [items, total] = await Promise.all([
    LeadModel.find(filter)
      .sort({ updatedAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit),

    LeadModel.countDocuments(filter),
  ]);

  return {
    items: items.map(safe),
    page: q.page,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.limit)),
  };
}

export async function workerLead(u: SafeUser, id: string) {
  const s = scope(u);

  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "Lead not found");
  }

  const lead = await LeadModel.findOne({
    _id: id,
    agencyId: s.agencyId,
    archived: false,
  });

  if (!lead || !lead.projectId) {
    throw new AppError(404, "Lead not found");
  }

  const project = await LeadProjectModel.findOne({
    _id: lead.projectId,
    agencyId: s.agencyId,
    assignedWorkerIds: s.workerId,
    archived: false,
  })
    .select("_id")
    .lean();

  if (!project) {
    throw new AppError(404, "Lead not found");
  }

  return safe(lead);
}

export async function updateWorkerLead(
  u: SafeUser,
  id: string,
  input: {
    status?: LeadStatus;
    notes?: string;
  },
) {
  const s = scope(u);

  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "Lead not found");
  }

  const lead = await LeadModel.findOne({
    _id: id,
    agencyId: s.agencyId,
    archived: false,
  });

  if (!lead) {
    throw new AppError(404, "Lead not found");
  }

  if (!lead.projectId) {
    throw new AppError(404, "Lead not found");
  }

  const project = await LeadProjectModel.findOne({
    _id: lead.projectId,
    agencyId: s.agencyId,
    assignedWorkerIds: s.workerId,
    archived: false,
  })
    .select("_id")
    .lean();

  if (!project) {
    throw new AppError(404, "Lead not found");
  }

  if (input.status !== undefined) {
    lead.status = input.status;
  }

  if (input.notes !== undefined) {
    lead.notes = input.notes;
  }

  await lead.save();

  return safe(lead);
}


export async function workerCalls(
  u: SafeUser,
  range: "today" | "7d" | "30d",
  page: number,
  limit: number,
) {
  const s = scope(u),
    from = start();

  if (range !== "today")
    from.setDate(from.getDate() - (range === "7d" ? 7 : 30));

  const filter = {
    agencyId: s.agencyId,
    telecallerId: s.workerId,
    startedAt: {
      $gte: from,
    },
  };

  const [items, total] = await Promise.all([
    CallModel.find(filter)
      .populate("leadId", "name phone email")
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    CallModel.countDocuments(filter),
  ]);

  return {
    items: items.map(safe),
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function logWorkerCall(
  u: SafeUser,
  input: {
    leadId: string;
    startedAt: string;
    durationSeconds: number;
    outcome: CallOutcome;
    notes?: string;
    nextFollowUpAt?: string;
  },
) {
  const s = scope(u),
    lead = await LeadModel.findOne({
      _id: input.leadId,
      agencyId: s.agencyId,
      assignedTo: s.workerId,
      archived: false,
    });

  if (!lead) throw new AppError(404, "Lead not found");

  if (
    input.outcome === "callback_requested" &&
    !input.nextFollowUpAt
  )
    throw new AppError(400, "Next follow-up date is required");

  const call = await CallModel.create({
    ...input,
    agencyId: s.agencyId,
    telecallerId: s.workerId,
    startedAt: new Date(input.startedAt),
  });

  if (
    input.outcome === "callback_requested" &&
    input.nextFollowUpAt
  )
    await FollowUpModel.create({
      agencyId: s.agencyId,
      leadId: lead._id,
      telecallerId: s.workerId,
      callId: call._id,
      title: `Follow up with ${lead.name}`,
      scheduledAt: new Date(input.nextFollowUpAt),
      status: "pending",
      notes: input.notes,
      completedAt: null,
    });

  const map: Partial<
    Record<CallOutcome, LeadStatus | undefined>
  > = {
    answered: lead.status === "new" ? "contacted" : undefined,
    interested: "interested",
    converted: "converted",
    not_interested: "not_interested",
    callback_requested: "follow_up",
  };

  const next =
    lead.status === "converted" ? undefined : map[input.outcome];

  if (next)
    await LeadModel.updateOne(
      {
        _id: lead._id,
      },
      {
        status: next,
      },
    );

  return safe(
    await call.populate("leadId", "name phone email"),
  );
}

export async function createWorkerFollowUp(
  u: SafeUser,
  input: {
  leadId: string;
  scheduledAt: string;
  leadStatus: "interested" | "follow_up";
  notes?: string;
},
) {
  const s = scope(u);

  if (!Types.ObjectId.isValid(input.leadId)) {
    throw new AppError(404, "Lead not found");
  }

  const lead = await LeadModel.findOne({
    _id: input.leadId,
    agencyId: s.agencyId,
    archived: false,
  });

  if (!lead || !lead.projectId) {
    throw new AppError(404, "Lead not found");
  }

  const project = await LeadProjectModel.findOne({
    _id: lead.projectId,
    agencyId: s.agencyId,
    assignedWorkerIds: s.workerId,
    archived: false,
  })
    .select("_id")
    .lean();

  if (!project) {
    throw new AppError(404, "Lead not found");
  }

  const scheduledAt = new Date(input.scheduledAt);

  if (
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt <= new Date()
  ) {
    throw new AppError(400, "Choose a future follow-up date");
  }

  const followUp = await FollowUpModel.create({
    agencyId: s.agencyId,
    leadId: lead._id,
    telecallerId: s.workerId,
    title: `Follow up with ${lead.name}`,
    scheduledAt,
    status: "pending",
    notes: input.notes,
    completedAt: null,
  });

  lead.status = input.leadStatus;
await lead.save();
  return safe(followUp);
}

export async function workerFollowUps(
  u: SafeUser,
  view: string,
  page: number,
  limit: number,
) {
  const s = scope(u),
    now = new Date(),
    today = start(),
    tomorrow = new Date(today);

  tomorrow.setDate(tomorrow.getDate() + 1);

  const filter: Record<string, unknown> = {
    agencyId: s.agencyId,
    telecallerId: s.workerId,
  };

  if (view === "today")
    Object.assign(filter, {
      status: "pending",
      scheduledAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

  if (view === "upcoming")
    Object.assign(filter, {
      status: "pending",
      scheduledAt: {
        $gte: tomorrow,
      },
    });

  if (view === "overdue")
    Object.assign(filter, {
      status: "pending",
      scheduledAt: {
        $lt: now,
      },
    });

  if (view === "completed") filter.status = "completed";

  if (view === "cancelled") filter.status = "cancelled";

  const [items, total] = await Promise.all([
    FollowUpModel.find(filter)
      .populate("leadId", "name phone requirement status")
      .sort({ scheduledAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    FollowUpModel.countDocuments(filter),
  ]);

  return {
    items: items.map(safe),
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function updateWorkerFollowUp(
  u: SafeUser,
  id: string,
  action: "complete" | "reschedule" | "cancel",
  scheduledAt?: string,
) {
  const s = scope(u),
    update =
  action === "complete"
    ? {
        status: "completed",
        completedAt: new Date(),
      }
    : action === "cancel"
      ? {
          status: "cancelled",
          completedAt: null,
        }
      : {
          scheduledAt: new Date(scheduledAt!),
          status: "pending",
        };

  if (
    action === "reschedule" &&
    new Date(scheduledAt!) <= new Date()
  )
    throw new AppError(400, "Choose a future date");

  const item = await FollowUpModel.findOneAndUpdate(
    {
      _id: id,
      agencyId: s.agencyId,
      telecallerId: s.workerId,
      status: "pending",
    },
    update,
    {
      new: true,
    },
  );

  if (!item) throw new AppError(404, "Follow-up not found");

  return safe(item);
}

export async function updateWorkerProfile(
  u: SafeUser,
  input: {
    name?: string;
    phone?: string;
  },
) {
  const user = await UserModel.findOneAndUpdate(
    {
      _id: u.id,
      agencyId: u.agencyId,
      role: "telecaller",
    },
    input,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) throw new AppError(404, "Profile not found");

  return toSafeUser(user);
}

  export async function createWorkerMessage(
  u: SafeUser,
  input: {
    message: string;
  },
) {
  const s = scope(u);

  const message = await MessageModel.create({
    agencyId: s.agencyId,
    telecallerId: s.workerId,
    message: input.message,
    readAt: null,
  });

  return safe(message);
}

export async function workerMessages(u: SafeUser) {
  const s = scope(u);

  const items = await MessageModel.find({
    agencyId: s.agencyId,
    telecallerId: s.workerId,
  }).sort({ createdAt: -1 });

  return {
    items: items.map(safe),
  };
}

export async function deleteWorkerMessage(
  u: SafeUser,
  id: string,
) {
  const s = scope(u);

  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "Message not found");
  }

  const message = await MessageModel.findOneAndDelete({
    _id: id,
    agencyId: s.agencyId,
    telecallerId: s.workerId,
  });

  if (!message) {
    throw new AppError(404, "Message not found");
  }

  return {
    id: String(message._id),
  };
}

export async function updateWorkerPresence(u: SafeUser) {
  const s = scope(u);

  await UserModel.updateOne(
    {
      _id: s.workerId,
      agencyId: s.agencyId,
      role: "telecaller",
      status: "active",
    },
    {
      $set: {
        lastSeenAt: new Date(),
      },
    },
  );

  return {
    lastSeenAt: new Date(),
  };
}