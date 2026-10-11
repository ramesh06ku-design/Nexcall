import bcrypt from "bcryptjs";
import mongoose, { Types, type ClientSession } from "mongoose";
import { AgencyModel } from "../models/Agency.js";
import { UserModel } from "../models/User.js";
import type { AuthenticatedUser, SafeUser } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { toSafeUser } from "../utils/user.js";
import { AdminNotificationModel } from "../models/AdminNotification.js";

export interface SignupInput {
  agencyName: string;
  ownerName: string;
  email: string;
  phone?: string;
  password: string;
}

interface PasswordLoginInput {
  identifier: string;
  password: string;
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function isTransactionUnsupported(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Transaction numbers are only allowed") ||
    error.message.includes("does not support retryable writes") ||
    error.message.includes("replica set")
  );
}

async function createAgencyAndOwner(
  input: SignupInput,
  passwordHash: string,
  agencyId: Types.ObjectId,
  userId: Types.ObjectId,
  session?: ClientSession,
) {
  const agency = new AgencyModel({
    _id: agencyId,
    name: input.agencyName,
    ownerId: userId,
    status: "active",
    subscriptionPlanId: null,
  });
  const user = new UserModel({
    _id: userId,
    name: input.ownerName,
    email: input.email,
    ...(input.phone ? { phone: input.phone } : {}),
    passwordHash,
    role: "agency",
    agencyId,
    status: "active",
  });

  await agency.save(session ? { session } : undefined);
  await user.save(session ? { session } : undefined);
  return toSafeUser(user);
}

async function createWithCompensatingRollback(
  input: SignupInput,
  passwordHash: string,
  agencyId: Types.ObjectId,
  userId: Types.ObjectId,
) {
  try {
    return await createAgencyAndOwner(input, passwordHash, agencyId, userId);
  } catch (error) {
    await Promise.allSettled([
      AgencyModel.deleteOne({ _id: agencyId }),
      UserModel.deleteOne({ _id: userId }),
    ]);
    throw error;
  }
}

async function notifyAdminAboutAgencyRegistration(
  agencyId: Types.ObjectId,
  agencyName: string,
) {
  try {
    await AdminNotificationModel.create({
      type: "agency_registered",
      title: "New Agency Registered",
      message: `${agencyName} has registered on NexCall CRM.`,
      agencyId,
      isRead: false,
    });
  } catch (error) {
    // Notification failure must not break a successful signup.
    console.error(
      "[admin-notification] Agency registration notification failed:",
      error,
    );
  }
}

export async function signupAgency(input: SignupInput): Promise<SafeUser> {
  const normalized = { ...input, email: input.email.trim().toLowerCase() };
  if (await UserModel.exists({ email: normalized.email })) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(normalized.password, 12);
  const agencyId = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const session = await mongoose.startSession();

  try {
    let createdUser: SafeUser | undefined;
    await session.withTransaction(async () => {
      createdUser = await createAgencyAndOwner(
        normalized,
        passwordHash,
        agencyId,
        userId,
        session,
      );
    });
    if (!createdUser) {
  throw new Error("Agency signup transaction did not complete");
}

await notifyAdminAboutAgencyRegistration(
  agencyId,
  normalized.agencyName,
);

return createdUser;
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      try {
        const createdUser = await createWithCompensatingRollback(
  normalized,
  passwordHash,
  agencyId,
  userId,
);

await notifyAdminAboutAgencyRegistration(
  agencyId,
  normalized.agencyName,
);

return createdUser;
      } catch (fallbackError) {
        if (isDuplicateKeyError(fallbackError)) {
          throw new AppError(409, "An account with this email already exists");
        }
        throw fallbackError;
      }
    }
    if (isDuplicateKeyError(error)) {
      throw new AppError(409, "An account with this email already exists");
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function findAndVerifyUser({ identifier, password }: PasswordLoginInput) {
  const normalized = identifier.trim().toLowerCase();
  const user = await UserModel.findOne({
    $or: [{ email: normalized }, { username: normalized }],
  }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }
  if (user.status !== "active") {
    throw new AppError(
      403,
      "Your account is currently inactive. Please contact your administrator.",
    );
  }
  if (user.agencyId) {
    const agency = await AgencyModel.findById(user.agencyId).select("status").lean();
    if (!agency || agency.status !== "active") {
      throw new AppError(
        403,
        "Your agency is currently suspended. Please contact support.",
      );
    }
  }
  return user;
}

export async function loginAgencyOrAdmin(input: PasswordLoginInput) {
  const user = await findAndVerifyUser(input);
  if (user.role === "telecaller") {
    throw new AppError(403, "Telecaller accounts should use Worker Login.");
  }
  return toSafeUser(user);
}

export async function loginWorker(input: PasswordLoginInput) {
  const user = await findAndVerifyUser(input);
  if (user.role !== "telecaller") {
    throw new AppError(403, "Admin and agency accounts should use Agency / Admin Login.");
  }
  return toSafeUser(user);
}

export async function getUserById(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError(401, "Authentication required");
  if (user.status !== "active") {
    throw new AppError(
      403,
      "Your account is currently inactive. Please contact your administrator.",
    );
  }
  if (user.agencyId) {
    const agency = await AgencyModel.findById(user.agencyId).select("status").lean();
    if (!agency || agency.status !== "active") {
      throw new AppError(
        403,
        "Your agency is currently suspended. Please contact support.",
      );
    }
  }
  return toSafeUser(user);
}

export async function getAuthenticatedUserProfile(
  user: SafeUser,
): Promise<AuthenticatedUser> {
  if (!user.agencyId) return user;
  const agency = await AgencyModel.findById(user.agencyId).select("name status").lean();
  if (!agency) return user;
  return {
    ...user,
    agency: {
      id: agency._id.toString(),
      name: agency.name,
      status: agency.status,
    },
  };
}
