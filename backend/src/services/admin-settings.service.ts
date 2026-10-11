
import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import { UserModel } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { toSafeUser } from "../utils/user.js";

export async function updateAdminProfile(
  userId: string,
  name: string,
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(401, "Invalid session");
  }

  const normalizedName = name.trim();

  if (
    normalizedName.length < 2 ||
    normalizedName.length > 100
  ) {
    throw new AppError(
      400,
      "Name must contain between 2 and 100 characters",
    );
  }

  const user = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      role: "admin",
      status: "active",
    },
    {
      $set: {
        name: normalizedName,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) {
    throw new AppError(404, "Admin account not found");
  }

  return toSafeUser(user);
}

export async function changeAdminPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(401, "Invalid session");
  }

  if (
    newPassword.length < 8 ||
    newPassword.length > 72
  ) {
    throw new AppError(
      400,
      "New password must contain between 8 and 72 characters",
    );
  }

  const user = await UserModel.findOne({
    _id: userId,
    role: "admin",
    status: "active",
  }).select("+passwordHash");

  if (!user) {
    throw new AppError(404, "Admin account not found");
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!isCurrentPasswordValid) {
    throw new AppError(
      400,
      "Current password is incorrect",
    );
  }

  const isSamePassword = await bcrypt.compare(
    newPassword,
    user.passwordHash,
  );

  if (isSamePassword) {
    throw new AppError(
      400,
      "New password must be different from current password",
    );
  }

  user.passwordHash = await bcrypt.hash(
    newPassword,
    12,
  );

  await user.save();

  return {
    message: "Password changed successfully",
  };
}
