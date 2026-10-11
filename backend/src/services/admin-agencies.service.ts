
import { Types } from "mongoose";

import { AgencyModel } from "../models/Agency.js";
import { UserModel } from "../models/User.js";
import { SubscriptionPlanModel } from "../models/SubscriptionPlan.js";
import { AppError } from "../utils/AppError.js";
import { AdminNotificationModel } from "../models/AdminNotification.js";


// Get all agencies
export async function getAdminAgencies() {
  const agencies = await AgencyModel.find()
    .sort({ createdAt: -1 })
    .lean();

  const items = await Promise.all(
    agencies.map(async (agency) => {
      const [owner, plan, telecallerCount] = await Promise.all([
        UserModel.findById(agency.ownerId)
          .select("name email status")
          .lean(),

        agency.subscriptionPlanId
          ? SubscriptionPlanModel.findById(agency.subscriptionPlanId)
              .select("name price billingInterval")
              .lean()
          : Promise.resolve(null),

        UserModel.countDocuments({
          agencyId: agency._id,
          role: "telecaller",
        }),
      ]);

      return {
        id: String(agency._id),
        name: agency.name,
        status: agency.status,

        owner: owner
          ? {
              id: String(owner._id),
              name: owner.name,
              email: owner.email,
              status: owner.status,
            }
          : null,

        plan: plan
          ? {
              id: String(plan._id),
              name: plan.name,
              price: plan.price,
              billingInterval: plan.billingInterval,
            }
          : null,

        telecallerCount,
        createdAt: agency.createdAt,
      };
    }),
  );

  return { items };
}

// Activate or suspend an agency

export async function updateAdminAgencyStatus(
  agencyId: string,
  status: "active" | "suspended",
) {
  if (!Types.ObjectId.isValid(agencyId)) {
    throw new AppError(400, "Invalid agency ID");
  }

  if (status !== "active" && status !== "suspended") {
    throw new AppError(400, "Invalid agency status");
  }

  // Only update when the status actually changes.
  const agency = await AgencyModel.findOneAndUpdate(
    {
      _id: agencyId,
      status: { $ne: status },
    },
    { $set: { status } },
    { new: true, runValidators: true },
  ).select("name status");

  if (agency) {
    try {
      await AdminNotificationModel.create({
        type:
          status === "suspended"
            ? "agency_suspended"
            : "agency_activated",

        title:
          status === "suspended"
            ? "Agency Suspended"
            : "Agency Activated",

        message:
          status === "suspended"
            ? `${agency.name} has been suspended.`
            : `${agency.name} has been activated.`,

        agencyId: agency._id,
        isRead: false,
      });
    } catch (error) {
      // Notification failure must not undo a successful status change.
      console.error(
        "[admin-notification] Agency status notification failed:",
        error,
      );
    }

    return {
      id: String(agency._id),
      name: agency.name,
      status: agency.status,
    };
  }

  // Agency may already have the requested status.
  const existingAgency = await AgencyModel.findById(
    agencyId,
  ).select("name status");

  if (!existingAgency) {
    throw new AppError(404, "Agency not found");
  }

  return {
    id: String(existingAgency._id),
    name: existingAgency.name,
    status: existingAgency.status,
  };
}


// Get details of a single agency
export async function getAdminAgencyById(agencyId: string) {
  if (!Types.ObjectId.isValid(agencyId)) {
    throw new AppError(400, "Invalid agency ID");
  }

  const result = await getAdminAgencies();

  const agency = result.items.find(
    (item) => item.id === agencyId,
  );

  if (!agency) {
    throw new AppError(404, "Agency not found");
  }

  const telecallers = await UserModel.find({
    agencyId,
    role: "telecaller",
  })
    .select("name email status lastSeenAt createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return {
    ...agency,
    telecallers: telecallers.map((worker) => ({
      id: String(worker._id),
      name: worker.name,
      email: worker.email,
      status: worker.status,
      lastSeenAt: worker.lastSeenAt ?? null,
      createdAt: worker.createdAt,
    })),
  };
}

// Assign, change or remove an agency subscription plan

export async function assignAdminAgencyPlan(
  agencyId: string,
  planId: string | null,
) {
  if (!Types.ObjectId.isValid(agencyId)) {
    throw new AppError(400, "Invalid agency ID");
  }

  let planName: string | null = null;

  if (planId !== null) {
    if (!Types.ObjectId.isValid(planId)) {
      throw new AppError(400, "Invalid plan ID");
    }

    const plan = await SubscriptionPlanModel.findById(
      planId,
    );

    if (!plan) {
      throw new AppError(
        404,
        "Subscription plan not found",
      );
    }

    if (!plan.isActive) {
      throw new AppError(
        400,
        "Cannot assign an inactive subscription plan",
      );
    }

    planName = plan.name;
  }

  // Update only when the assigned plan actually changes.
  const agency = await AgencyModel.findOneAndUpdate(
    {
      _id: agencyId,
      subscriptionPlanId:
        planId === null
          ? { $ne: null }
          : { $ne: new Types.ObjectId(planId) },
    },
    {
      $set: {
        subscriptionPlanId: planId,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (agency) {
    try {
      await AdminNotificationModel.create({
        type: "plan_assigned",
        title:
          planId === null
            ? "Subscription Plan Removed"
            : "Subscription Plan Updated",
        message:
          planId === null
            ? `Subscription plan removed from ${agency.name}.`
            : `${planName} assigned to ${agency.name}.`,
        agencyId: agency._id,
        isRead: false,
      });
    } catch (error) {
      console.error(
        "[admin-notification] Plan assignment notification failed:",
        error,
      );
    }

    return {
      id: String(agency._id),
      name: agency.name,
      subscriptionPlanId: agency.subscriptionPlanId
        ? String(agency.subscriptionPlanId)
        : null,
    };
  }

  // Return current data when the plan is unchanged.
  const existingAgency = await AgencyModel.findById(
    agencyId,
  );

  if (!existingAgency) {
    throw new AppError(404, "Agency not found");
  }

  return {
    id: String(existingAgency._id),
    name: existingAgency.name,
    subscriptionPlanId: existingAgency.subscriptionPlanId
      ? String(existingAgency.subscriptionPlanId)
      : null,
  };
}

