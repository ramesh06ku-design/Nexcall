import mongoose from "mongoose";

import { AgencyModel } from "../models/Agency.js";
import { UserModel } from "../models/User.js";
import type { SafeUser } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";

export interface UpdateAgencySettingsInput {
  agencyName: string;
  ownerName: string;
  email: string;
}

export async function updateAgencySettings(
  user: SafeUser,
  input: UpdateAgencySettingsInput,
) {
  if (!user.agencyId) {
    throw new AppError(400, "Agency account is required.");
  }

  const email = input.email.trim().toLowerCase();

  const existingEmail = await UserModel.exists({
    email,
    _id: { $ne: user.id },
  });

  if (existingEmail) {
    throw new AppError(
      409,
      "An account with this email already exists.",
    );
  }

  const session = await mongoose.startSession();

  try {
    let updated = false;

    await session.withTransaction(async () => {
      const agency = await AgencyModel.findOneAndUpdate(
        {
          _id: user.agencyId,
          ownerId: user.id,
        },
        {
          $set: {
            name: input.agencyName.trim(),
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!agency) {
        throw new AppError(404, "Agency not found.");
      }

      const owner = await UserModel.findOneAndUpdate(
        {
          _id: user.id,
          agencyId: user.agencyId,
          role: "agency",
        },
        {
          $set: {
            name: input.ownerName.trim(),
            email,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!owner) {
        throw new AppError(404, "Agency owner not found.");
      }

      updated = true;
    });

    if (!updated) {
      throw new AppError(500, "Could not update agency settings.");
    }

    return {
      agencyName: input.agencyName.trim(),
      ownerName: input.ownerName.trim(),
      email,
    };
  } finally {
    await session.endSession();
  }
}