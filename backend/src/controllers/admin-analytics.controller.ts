
import type { Request, Response } from "express";

import { getAdminAnalytics } from "../services/admin-analytics.service.js";

export async function adminAnalytics(
  _req: Request,
  res: Response,
) {
  const data = await getAdminAnalytics();

  res.status(200).json({
    success: true,
    data,
  });
}
