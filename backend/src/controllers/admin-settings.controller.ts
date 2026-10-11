
import type { Request, Response } from "express";

import {
  updateAdminProfile,
  changeAdminPassword,
} from "../services/admin-settings.service.js";

export async function adminUpdateProfile(
  req: Request,
  res: Response,
) {
  const userId = req.user!.id;

  const user = await updateAdminProfile(
    userId,
    req.body.name,
  );

  res.status(200).json({
    success: true,
    data: user,
    message: "Profile updated successfully",
  });
}

export async function adminChangePassword(
  req: Request,
  res: Response,
) {
  const userId = req.user!.id;

  const result = await changeAdminPassword(
    userId,
    req.body.currentPassword,
    req.body.newPassword,
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
}
