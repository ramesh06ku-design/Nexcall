import type { Request, Response } from "express";

import { getAdminDashboard } from "../services/admin-dashboard.service.js";

export async function adminDashboard(
  _req: Request,
  res: Response,
) {
  const data = await getAdminDashboard();

  res.status(200).json({
    success: true,
    data,
  });
}