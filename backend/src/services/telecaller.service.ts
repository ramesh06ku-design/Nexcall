
import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import { UserModel } from "../models/User.js";
import { AgencyModel } from "../models/Agency.js";
import { SubscriptionPlanModel } from "../models/SubscriptionPlan.js";

import type { SafeUser, UserStatus } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { toSafeUser } from "../utils/user.js";

export interface CreateTelecallerInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface UpdateTelecallerInput {
  name?: string;
  phone?: string;
  status?: "active" | "inactive";
}

export interface ListTelecallersInput {
  search?: string | undefined;
  status?: "active" | "inactive" | undefined;
  page: number;
  limit: number;
}

function requireAgency(user: SafeUser) {
  if (user.role !== "agency" || !user.agencyId) {
    throw new AppError(
      403,
      "An active agency account is required"
    );
  }

  return user.agencyId;
}

function tenantFilter(user: SafeUser, id?: string) {
  const agencyId = requireAgency(user);

  if (id && !Types.ObjectId.isValid(id)) {
    throw new AppError(404, "Telecaller not found");
  }

  return {
    ...(id ? { _id: id } : {}),
    agencyId,
    role: "telecaller" as const,
  };
}

function duplicate(error: unknown): error is { code: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

async function checkTelecallerPlanLimit(agencyId: string) {
  const agency = await AgencyModel.findById(agencyId);

  if (!agency) {
    throw new AppError(404, "Agency not found");
  }

  if (agency.status !== "active") {
    throw new AppError(403, "Agency is suspended");
  }

  if (!agency.subscriptionPlanId) {
    throw new AppError(
      403,
      "No subscription plan assigned. Contact the platform admin."
    );
  }

  const plan = await SubscriptionPlanModel.findById(
    agency.subscriptionPlanId
  );

  if (!plan) {
    throw new AppError(
      403,
      "Assigned subscription plan not found."
    );
  }

  const telecallerLimit = plan.limits.telecallers;

  const currentTelecallers = await UserModel.countDocuments({
    agencyId,
    role: "telecaller",
  });

  if (currentTelecallers >= telecallerLimit) {
    throw new AppError(
      403,
      `Telecaller limit reached. Your plan allows ${telecallerLimit} telecaller(s).`
    );
  }
}

export async function createTelecallerForAgency(
  user: SafeUser,
  input: CreateTelecallerInput
) {
  const agencyId = requireAgency(user);
  const email = input.email.trim().toLowerCase();

  if (await UserModel.exists({ email })) {
    throw new AppError(
      409,
      "An account with this email already exists."
    );
  }

  await checkTelecallerPlanLimit(agencyId);

  try {
    const telecaller = await UserModel.create({
      name: input.name,
      email,
      ...(input.phone ? { phone: input.phone } : {}),
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "telecaller",
      agencyId,
      status: "active",
    });

    return toSafeUser(telecaller);
  } catch (error) {
    if (duplicate(error)) {
      throw new AppError(
        409,
        "An account with this email already exists."
      );
    }

    throw error;
  }
}

export async function listTelecallersForAgency(
  user: SafeUser,
  input: ListTelecallersInput
) {
  const filter: Record<string, unknown> = tenantFilter(user);

  if (input.status) {
    filter.status = input.status;
  }

  if (input.search) {
    const value = input.search.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    filter.$or = ["name", "email", "phone"].map((field) => ({
      [field]: {
        $regex: value,
        $options: "i",
      },
    }));
  }

  const base = tenantFilter(user);

  const [documents, total, active, inactive] =
    await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((input.page - 1) * input.limit)
        .limit(input.limit),

      UserModel.countDocuments(filter),

      UserModel.countDocuments({
        ...base,
        status: "active",
      }),

      UserModel.countDocuments({
        ...base,
        status: "inactive",
      }),
    ]);

  return {
    items: documents.map(toSafeUser),
    page: input.page,
    limit: input.limit,
    total,
    totalPages: Math.max(
      1,
      Math.ceil(total / input.limit)
    ),
    summary: {
      total: active + inactive,
      active,
      inactive,
    },
  };
}

export async function getTelecallerForAgency(
  user: SafeUser,
  id: string
) {
  const telecaller = await UserModel.findOne(
    tenantFilter(user, id)
  );

  if (!telecaller) {
    throw new AppError(404, "Telecaller not found");
  }

  return toSafeUser(telecaller);
}

export async function updateTelecallerForAgency(
  user: SafeUser,
  id: string,
  input: UpdateTelecallerInput
) {
  const update: {
    name?: string;
    phone?: string;
    status?: UserStatus;
    $unset?: { phone: 1 };
  } = {};

  if (input.name !== undefined) {
    update.name = input.name;
  }

  if (input.status !== undefined) {
    update.status = input.status;
  }

  if (input.phone === "") {
    update.$unset = { phone: 1 };
  } else if (input.phone !== undefined) {
    update.phone = input.phone;
  }

  const telecaller = await UserModel.findOneAndUpdate(
    tenantFilter(user, id),
    update,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!telecaller) {
    throw new AppError(404, "Telecaller not found");
  }

  return toSafeUser(telecaller);
}
