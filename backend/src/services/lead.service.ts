import { Types } from "mongoose";

import {
  LeadModel,
  LEAD_STATUSES,
  type LeadStatus,
} from "../models/Lead.js";
import { UserModel } from "../models/User.js";
import type { SafeUser } from "../types/domain.js";
import { LeadProjectModel } from "../models/LeadProject.js";
import { AppError } from "../utils/AppError.js";
import { AgencyModel } from "../models/Agency.js";
import { SubscriptionPlanModel } from "../models/SubscriptionPlan.js";


import { z } from "zod";

export interface LeadInput {
  name: string;
  phone: string;
  requirement?: string;
  email?: string;
  company?: string;
  source?: string;
  status?: LeadStatus;
  assignedTo?: string | null;
  notes?: string;
}

export interface LeadListInput {
  search?: string | undefined;
  status?: LeadStatus | undefined;
  assignedTo?: string | undefined;
  archived: boolean;
  page: number;
  limit: number;
  projectId?: string | undefined;
  unprojectedOnly?: boolean | undefined;
}

function agencyId(user: SafeUser) {
  if (user.role !== "agency" || !user.agencyId)
    throw new AppError(403, "An active agency account is required");

  return user.agencyId;
}


async function checkLeadPlanLimit(
  tenant: string,
  incomingCount: number,
) {
  const agency = await AgencyModel.findById(tenant);

  if (!agency) {
    throw new AppError(404, "Agency not found");
  }

  if (agency.status !== "active") {
    throw new AppError(403, "Agency is suspended");
  }

  if (!agency.subscriptionPlanId) {
    throw new AppError(
      403,
      "No subscription plan assigned. Contact the platform admin.",
    );
  }

  const plan = await SubscriptionPlanModel.findById(
    agency.subscriptionPlanId,
  );

  if (!plan) {
    throw new AppError(
      403,
      "Assigned subscription plan not found.",
    );
  }

  const currentLeads = await LeadModel.countDocuments({
    agencyId: tenant,
  });

  const leadLimit = plan.limits.leads;

  if (currentLeads + incomingCount > leadLimit) {
    throw new AppError(
      403,
      `Lead limit exceeded. Your plan allows ${leadLimit} leads. You currently have ${currentLeads}.`,
    );
  }
}


export function leadTenantFilter(user: SafeUser, id?: string) {
  const tenant = agencyId(user);

  if (id && !Types.ObjectId.isValid(id))
    throw new AppError(404, "Lead not found");

  return {
    ...(id ? { _id: id } : {}),
    agencyId: tenant,
  };
}

async function validateAssignee(
  user: SafeUser,
  assignedTo: string | null | undefined,
) {
  if (!assignedTo) return null;

  if (!Types.ObjectId.isValid(assignedTo))
    throw new AppError(400, "Select a valid telecaller");

  const telecaller = await UserModel.findOne({
    _id: assignedTo,
    agencyId: agencyId(user),
    role: "telecaller",
    status: "active",
  })
    .select("_id")
    .lean();

  if (!telecaller)
    throw new AppError(
      400,
      "The selected telecaller does not belong to your agency",
    );

  return telecaller._id;
}

const safe = (document: { toJSON(): unknown }) => document.toJSON();

export async function createLeadForAgency(
  user: SafeUser,
  input: LeadInput,
) {
    const tenant = agencyId(user);

  await checkLeadPlanLimit(tenant, 1);
  const assignedTo = await validateAssignee(user, input.assignedTo);

  const lead = await LeadModel.create({
    ...input,
    email: input.email?.toLowerCase(),
    agencyId: tenant,
    assignedTo,
    status: input.status ?? "new",
    archived: false,
  });

  return safe(lead);
}

export async function listLeadsForAgency(
  user: SafeUser,
  input: LeadListInput,
) {
  if (input.projectId) {
    if (!Types.ObjectId.isValid(input.projectId)) throw new AppError(404, "Lead project not found");
    const project = await LeadProjectModel.exists({ _id: input.projectId, agencyId: agencyId(user), archived: false });
    if (!project) throw new AppError(404, "Lead project not found");
  }
  const filter: Record<string, unknown> = {
    ...leadTenantFilter(user),
    archived: input.archived,
  };

  if (input.projectId) {
  filter.projectId = input.projectId;
}

if (input.unprojectedOnly && !input.projectId) {
  filter.projectId = { $exists: false };
}

  if (input.status) filter.status = input.status;

  if (input.assignedTo)
    filter.assignedTo =
      input.assignedTo === "unassigned" ? null : input.assignedTo;

  if (input.search) {
    const value = input.search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

    filter.$or = ["name", "email", "phone", "requirement", "company"].map((field) => ({
      [field]: {
        $regex: value,
        $options: "i",
      },
    }));
  }

  const base: Record<string, unknown> = {
  ...leadTenantFilter(user),
  archived: false,
};

if (input.projectId) {
  base.projectId = input.projectId;
}

  const [items, total, newCount, interested, converted] =
    await Promise.all([
      LeadModel.find(filter)
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip((input.page - 1) * input.limit)
        .limit(input.limit),
      LeadModel.countDocuments(filter),
      LeadModel.countDocuments({
        ...base,
        status: "new",
      }),
      LeadModel.countDocuments({
        ...base,
        status: "interested",
      }),
      LeadModel.countDocuments({
        ...base,
        status: "converted",
      }),
    ]);

  return {
    items: items.map(safe),
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / input.limit)),
    summary: {
      total: await LeadModel.countDocuments(base),
      new: newCount,
      interested,
      converted,
    },
  };
}

export async function listLeadProjectsForAgency(
  user: SafeUser,
) {
  const tenant = agencyId(user);

  const projects = await LeadProjectModel.find({
    agencyId: tenant,
    archived: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  const items = await Promise.all(
    projects.map(async (project) => {
      const leadCount = await LeadModel.countDocuments({
        agencyId: tenant,
        projectId: project._id,
        archived: false,
      });

      const assignedWorkerIds = (
        project.assignedWorkerIds ?? []
      ).map((workerId) => String(workerId));

      const assignedWorkers =
        assignedWorkerIds.length > 0
          ? await UserModel.find({
              _id: {
                $in: assignedWorkerIds,
              },
              agencyId: tenant,
              role: "telecaller",
            })
              .select("_id name email status")
              .lean()
          : [];

      return {
        id: String(project._id),
        name: project.name,
        leadCount,
        createdAt: project.createdAt,

        assignedWorkerIds,

        assignedWorkers: assignedWorkers.map((worker) => ({
          id: String(worker._id),
          name: worker.name,
          email: worker.email,
          status: worker.status,
        })),
      };
    }),
  );

  return {
    items,
  };
}

export async function updateLeadProjectAssignmentsForAgency(
  user: SafeUser,
  projectId: string,
  workerIds: string[],
) {
  const tenant = agencyId(user);

  if (!Types.ObjectId.isValid(projectId)) {
    throw new AppError(404, "Lead project not found");
  }

  const project = await LeadProjectModel.findOne({
    _id: projectId,
    agencyId: tenant,
    archived: false,
  });

  if (!project) {
    throw new AppError(404, "Lead project not found");
  }

  const uniqueWorkerIds = [...new Set(workerIds)];

  for (const workerId of uniqueWorkerIds) {
    if (!Types.ObjectId.isValid(workerId)) {
      throw new AppError(400, "One or more selected telecallers are invalid");
    }
  }

  if (uniqueWorkerIds.length > 0) {
    const workers = await UserModel.find({
      _id: {
        $in: uniqueWorkerIds,
      },
      agencyId: tenant,
      role: "telecaller",
      status: "active",
    })
      .select("_id")
      .lean();

    if (workers.length !== uniqueWorkerIds.length) {
      throw new AppError(
        400,
        "One or more selected telecallers are invalid or do not belong to your agency",
      );
    }
  }

  project.assignedWorkerIds = uniqueWorkerIds.map(
    (workerId) => new Types.ObjectId(workerId),
  );

  await project.save();

  const assignedWorkers = await UserModel.find({
    _id: {
      $in: project.assignedWorkerIds,
    },
  })
    .select("_id name email")
    .lean();

  return {
    id: String(project._id),
    name: project.name,
    assignedWorkerIds: project.assignedWorkerIds.map(String),
    assignedWorkers: assignedWorkers.map((worker) => ({
      id: String(worker._id),
      name: worker.name,
      email: worker.email,
    })),
  };
}

export async function deleteLeadProjectForAgency(
  user: SafeUser,
  projectId: string,
) {
  const tenant = agencyId(user);
  if (!Types.ObjectId.isValid(projectId)) throw new AppError(404, "Lead project not found");

  const project = await LeadProjectModel.findOne({
    _id: projectId,
    agencyId: tenant,
  });

  if (!project) {
    throw new AppError(404, "Lead project not found");
  }

  const deletedLeads = await LeadModel.deleteMany({
    agencyId: tenant,
    projectId: project._id,
  });

  await LeadProjectModel.deleteOne({
    _id: project._id,
    agencyId: tenant,
  });

  return {
    projectId: String(project._id),
    deletedLeads: deletedLeads.deletedCount,
  };
}

export async function deleteLeadsForAgency(
  user: SafeUser,
  leadIds: string[],
) {
  const tenant = agencyId(user);

  const leads = await LeadModel.find({
    _id: { $in: leadIds },
    agencyId: tenant,
  }).select("_id");

  if (leads.length !== leadIds.length) {
    throw new AppError(
      404,
      "One or more selected leads were not found.",
    );
  }

  const result = await LeadModel.deleteMany({
    _id: { $in: leadIds },
    agencyId: tenant,
  });

  return {
    deletedLeads: result.deletedCount,
  };
}

export async function getLeadForAgency(
  user: SafeUser,
  id: string,
) {
  const lead = await LeadModel.findOne(
    leadTenantFilter(user, id),
  ).populate("assignedTo", "name email");

  if (!lead) throw new AppError(404, "Lead not found");

  return safe(lead);
}

export async function updateLeadForAgency(
  user: SafeUser,
  id: string,
  input: Partial<LeadInput>,
) {
  const update: Record<string, unknown> = {
    ...input,
  };

  if (input.assignedTo !== undefined)
    update.assignedTo = await validateAssignee(
      user,
      input.assignedTo,
    );

  if (input.email) update.email = input.email.toLowerCase();

  const lead = await LeadModel.findOneAndUpdate(
    leadTenantFilter(user, id),
    update,
    {
      new: true,
      runValidators: true,
    },
  ).populate("assignedTo", "name email");

  if (!lead) throw new AppError(404, "Lead not found");

  return safe(lead);
}

export async function archiveLeadForAgency(
  user: SafeUser,
  id: string,
) {
  const lead = await LeadModel.findOneAndUpdate(
    {
      ...leadTenantFilter(user, id),
      archived: false,
    },
    {
      archived: true,
    },
    {
      new: true,
    },
  );

  if (!lead) throw new AppError(404, "Lead not found");

  return safe(lead);
}

export async function deleteLeadForAgency(
  user: SafeUser,
  id: string,
) {
  const lead = await LeadModel.findOneAndDelete(
    leadTenantFilter(user, id),
  );

  if (!lead) {
    throw new AppError(404, "Lead not found");
  }

  return {
    id: String(lead._id),
  };
}

export interface LeadImportRow {
  rowNumber: number;
  name?: string;
  phone?: string;
  requirement?: string;
  email?: string;
  company?: string;
  source?: string;
  status?: string;
  notes?: string;
}

export interface LeadImportInput {
  projectName?: string;
  rows: LeadImportRow[];
  defaultStatus: LeadStatus;
  assignedTo?: string | null;
}

const importRowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is required")
    .max(120),

  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .max(30)
    .regex(/^\+?[0-9 ()-]+$/, "Phone is invalid"),

  requirement: z
    .string()
    .trim()
    .min(2, "Requirement is required")
    .max(500),

  email: z
    .union([
      z.email("Email is invalid"),
      z.literal(""),
    ])
    .optional(),

  company: z.string().trim().max(120).optional(),

  source: z.string().trim().max(80).optional(),

  notes: z.string().trim().max(2000).optional(),
});

const normalizePhone = (phone: string) => {
  let value = phone.replace(/\D/g, "");

  if (value.length === 11 && value.startsWith("0")) {
    value = value.slice(1);
  }

  if (value.length === 12 && value.startsWith("91")) {
    value = value.slice(2);
  }

  return value;
};

export async function importLeadsForAgency(
  user: SafeUser,
  input: LeadImportInput,
) {
  const tenant = agencyId(user);

  const assignedTo = await validateAssignee(
    user,
    input.assignedTo,
  );

  const failed: {
    rowNumber: number;
    reason: string;
  }[] = [];

  const valid: {
  rowNumber: number;
  name: string;
  phone: string;
  requirement: string;
  email?: string | undefined;
  company?: string | undefined;
  source?: string | undefined;
  status: LeadStatus;
  notes?: string | undefined;
}[] = [];

  for (const row of input.rows) {
    const parsed = importRowSchema.safeParse(row);

    if (!parsed.success) {
      failed.push({
        rowNumber: row.rowNumber,
        reason:
          parsed.error.issues[0]?.message ?? "Invalid row",
      });

      continue;
    }

    const status = LEAD_STATUSES.includes(
      row.status
        ?.trim()
        .toLowerCase()
        .replace(/[ -]+/g, "_") as LeadStatus,
    )
      ? (row.status!
          .trim()
          .toLowerCase()
          .replace(/[ -]+/g, "_") as LeadStatus)
      : input.defaultStatus;

    valid.push({
      ...parsed.data,
      rowNumber: row.rowNumber,
      ...(parsed.data.email
        ? {
            email: parsed.data.email.toLowerCase(),
          }
        : {}),
      status,
    });
  }

  const existing = await LeadModel.find({
    agencyId: tenant,
  })
    .select("phone")
    .lean();

  const duplicatePhones = new Set(
    existing.map((row) => normalizePhone(row.phone)),
  );

  const seen = new Set<string>();

  const skipped: {
    rowNumber: number;
    reason: string;
  }[] = [];

  const documents = [];

  for (const row of valid) {
    const phone = normalizePhone(row.phone);

    if (duplicatePhones.has(phone) || seen.has(phone)) {
      skipped.push({
        rowNumber: row.rowNumber,
        reason:
          "A lead with this phone number already exists",
      });

      continue;
    }

    seen.add(phone);

    const { rowNumber: _, ...values } = row;

    void _;

    documents.push({
  ...values,
  phone,
  agencyId: tenant,
  assignedTo,
  status: row.status,
  archived: false,
});
  }

    if (documents.length > 0) {
    await checkLeadPlanLimit(tenant, documents.length);
  }

  let project = null;

if (documents.length) {
  project = await LeadProjectModel.create({
    agencyId: tenant,
    name: input.projectName?.trim() || "Imported Leads",
    archived: false,
  });

  for (const document of documents) {
    Object.assign(document, {
      projectId: project._id,
    });
  }
}

  let imported = 0;

  if (documents.length) {
    try {
      const inserted = await LeadModel.insertMany(
        documents,
        {
          ordered: false,
        },
      );

      imported = inserted.length;
    } catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  throw new AppError(
    500,
    `Lead import database error: ${message}`
  );
}
  }

  return {
    imported,
    skipped: skipped.length,
    failed: failed.length,
    skippedRows: skipped,
    failedRows: failed,
  };
}

export { LEAD_STATUSES };
