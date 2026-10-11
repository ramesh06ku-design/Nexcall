
import { Types } from "mongoose";

import { SubscriptionPlanModel } from "../models/SubscriptionPlan.js";
import { AppError } from "../utils/AppError.js";

export interface CreateAdminPlanInput {
  name: string;
  price: number;
  billingInterval: "monthly" | "yearly";
  description: string;
  limits: {
    telecallers: number;
    leads: number;
  };
}

// Get all subscription plans
export async function getAdminPlans() {
  const plans = await SubscriptionPlanModel.find()
    .sort({ createdAt: -1 })
    .lean();

  return {
    items: plans.map((plan) => ({
      id: String(plan._id),
      name: plan.name,
      price: plan.price,
      billingInterval: plan.billingInterval,
      description: plan.description,
      limits: {
        telecallers: plan.limits?.telecallers ?? 0,
        leads: plan.limits?.leads ?? 0,
      },
      isActive: plan.isActive,
      createdAt: plan.createdAt,
    })),
  };
}

// Create a subscription plan
export async function createAdminPlan(
  input: CreateAdminPlanInput,
) {
  const name = input.name.trim();

  const existingPlan = await SubscriptionPlanModel.exists({
    name,
  });

  if (existingPlan) {
    throw new AppError(
      409,
      "A plan with this name already exists",
    );
  }

  const plan = await SubscriptionPlanModel.create({
    name,
    price: input.price,
    billingInterval: input.billingInterval,
    description: input.description.trim(),
    limits: input.limits,
    isActive: true,
  });

  return {
    id: String(plan._id),
    name: plan.name,
    price: plan.price,
    billingInterval: plan.billingInterval,
    description: plan.description,
    limits: {
      telecallers: plan.limits?.telecallers ?? 0,
        leads: plan.limits?.leads ?? 0,
    },
    isActive: plan.isActive,
    createdAt: plan.createdAt,
  };
}

// Update a subscription plan
export async function updateAdminPlan(
  planId: string,
  input: CreateAdminPlanInput,
) {
  if (!Types.ObjectId.isValid(planId)) {
    throw new AppError(400, "Invalid plan ID");
  }

  const name = input.name.trim();

  const duplicatePlan = await SubscriptionPlanModel.findOne({
    name,
    _id: { $ne: planId },
  });

  if (duplicatePlan) {
    throw new AppError(
      409,
      "A plan with this name already exists",
    );
  }

  const plan = await SubscriptionPlanModel.findByIdAndUpdate(
    planId,
    {
      $set: {
        name,
        price: input.price,
        billingInterval: input.billingInterval,
        description: input.description.trim(),
        limits: input.limits,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!plan) {
    throw new AppError(
      404,
      "Subscription plan not found",
    );
  }

  return {
    id: String(plan._id),
    name: plan.name,
    price: plan.price,
    billingInterval: plan.billingInterval,
    description: plan.description,
    limits: {
      telecallers: plan.limits?.telecallers ?? 0,
        leads: plan.limits?.leads ?? 0,
    },
    isActive: plan.isActive,
    createdAt: plan.createdAt,
  };
}

// Activate or deactivate a subscription plan
export async function updateAdminPlanStatus(
  planId: string,
  isActive: boolean,
) {
  if (!Types.ObjectId.isValid(planId)) {
    throw new AppError(400, "Invalid plan ID");
  }

  const plan = await SubscriptionPlanModel.findByIdAndUpdate(
    planId,
    {
      $set: { isActive },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!plan) {
    throw new AppError(
      404,
      "Subscription plan not found",
    );
  }

  return {
    id: String(plan._id),
    name: plan.name,
    isActive: plan.isActive,
  };
}
