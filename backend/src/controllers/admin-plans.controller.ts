
import type { Request, Response } from "express";
import { z } from "zod";

import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  updateAdminPlanStatus,
} from "../services/admin-plans.service.js";

// Get all subscription plans
export async function adminPlans(
  _req: Request,
  res: Response,
) {
  const data = await getAdminPlans();

  res.status(200).json({
    success: true,
    data,
  });
}

// Validate plan details
const createPlanSchema = z.object({
  name: z.string().trim().min(2).max(100),
  price: z.number().finite().nonnegative(),
  billingInterval: z.enum(["monthly", "yearly"]),
  description: z.string().trim().max(1000),
  limits: z.object({
    telecallers: z.number().int().nonnegative(),
    leads: z.number().int().nonnegative(),
  }),
});

// Create a subscription plan
export async function adminCreatePlan(
  req: Request,
  res: Response,
) {
  const input = createPlanSchema.parse(req.body);

  const plan = await createAdminPlan(input);

  res.status(201).json({
    success: true,
    data: plan,
  });
}

// Update an existing subscription plan
export async function adminUpdatePlan(
  req: Request,
  res: Response,
) {
  const planId = req.params.id;

  if (typeof planId !== "string") {
    res.status(400).json({
      success: false,
      message: "Invalid plan ID",
    });
    return;
  }

  const input = createPlanSchema.parse(req.body);

  const plan = await updateAdminPlan(planId, input);

  res.status(200).json({
    success: true,
    data: plan,
  });
}

// Validate plan activation status
const updatePlanStatusSchema = z.object({
  isActive: z.boolean(),
});

// Activate or deactivate a subscription plan
export async function adminUpdatePlanStatus(
  req: Request,
  res: Response,
) {
  const planId = req.params.id;

  if (typeof planId !== "string") {
    res.status(400).json({
      success: false,
      message: "Invalid plan ID",
    });
    return;
  }

  const { isActive } = updatePlanStatusSchema.parse(
    req.body,
  );

  const plan = await updateAdminPlanStatus(
    planId,
    isActive,
  );

  res.status(200).json({
    success: true,
    data: plan,
  });
}
