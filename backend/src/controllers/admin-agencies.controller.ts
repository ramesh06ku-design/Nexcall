
import type { Request, Response } from "express";
import { z } from "zod";

import {
  getAdminAgencies,
  getAdminAgencyById,
  updateAdminAgencyStatus,
  assignAdminAgencyPlan,
} from "../services/admin-agencies.service.js";

// Get all agencies
export async function adminAgencies(
  _req: Request,
  res: Response,
) {
  const data = await getAdminAgencies();

  res.status(200).json({
    success: true,
    data,
  });
}

// Update agency status
const updateAgencyStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

export async function adminUpdateAgencyStatus(
  req: Request,
  res: Response,
) {
  const { status } = updateAgencyStatusSchema.parse(req.body);

  const agencyId = req.params.id;

  if (typeof agencyId !== "string") {
    res.status(400).json({
      success: false,
      message: "Invalid agency ID",
    });
    return;
  }

  const agency = await updateAdminAgencyStatus(
    agencyId,
    status,
  );

  res.status(200).json({
    success: true,
    data: agency,
  });
}

// Get agency details
export async function adminAgencyDetails(
  req: Request,
  res: Response,
) {
  const agencyId = req.params.id;

  if (typeof agencyId !== "string") {
    res.status(400).json({
      success: false,
      message: "Invalid agency ID",
    });
    return;
  }

  const data = await getAdminAgencyById(agencyId);

  res.status(200).json({
    success: true,
    data,
  });
}

// Assign, change or remove agency subscription plan
const assignAgencyPlanSchema = z.object({
  planId: z.string().nullable(),
});

export async function adminAssignAgencyPlan(
  req: Request,
  res: Response,
) {
  const agencyId = req.params.id;

  if (typeof agencyId !== "string") {
    res.status(400).json({
      success: false,
      message: "Invalid agency ID",
    });
    return;
  }

  const { planId } = assignAgencyPlanSchema.parse(
    req.body,
  );

  const result = await assignAdminAgencyPlan(
    agencyId,
    planId,
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}
