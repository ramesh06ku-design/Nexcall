
import { Types } from "mongoose";
import { AdminNotificationModel } from "../models/AdminNotification.js";

export async function getAdminNotifications() {
  const [notifications, unreadCount] = await Promise.all([
    AdminNotificationModel.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),

    AdminNotificationModel.countDocuments({
      isRead: false,
    }),
  ]);

  return {
    items: notifications.map((notification) => ({
      id: String(notification._id),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      agencyId: notification.agencyId
        ? String(notification.agencyId)
        : null,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    })),
    unreadCount,
  };
}

export async function markAdminNotificationRead(
  notificationId: string,
) {
  if (!Types.ObjectId.isValid(notificationId)) {
    throw new Error("Invalid notification ID");
  }

  const notification =
    await AdminNotificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true },
    );

  if (!notification) {
    throw new Error("Notification not found");
  }

  return {
    id: String(notification._id),
    isRead: notification.isRead,
  };
}

export async function markAllAdminNotificationsRead() {
  const result = await AdminNotificationModel.updateMany(
    { isRead: false },
    { $set: { isRead: true } },
  );

  return {
    updatedCount: result.modifiedCount,
  };
}
