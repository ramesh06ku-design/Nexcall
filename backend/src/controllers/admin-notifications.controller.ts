
import type { Request, Response } from "express";

import {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../services/admin-notifications.service.js";

export async function adminNotifications(
  _req: Request,
  res: Response,
) {
  const data = await getAdminNotifications();

  res.status(200).json({
    success: true,
    data,
  });
}

export async function adminMarkNotificationRead(
  req: Request,
  res: Response,
) {
  const notificationId = String(req.params.id);

  const data = await markAdminNotificationRead(
    notificationId,
  );

  res.status(200).json({
    success: true,
    data,
  });
}

export async function adminMarkAllNotificationsRead(
  _req: Request,
  res: Response,
) {
  const data = await markAllAdminNotificationsRead();

  res.status(200).json({
    success: true,
    data,
  });
}
    