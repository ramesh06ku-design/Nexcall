import { Types } from "mongoose";
import { MessageModel } from "../models/Message.js";
import type { SafeUser } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";

function agencyScope(u: SafeUser) {
  if (u.role !== "agency" || !u.agencyId) {
    throw new AppError(
      403,
      "An agency account is required",
    );
  }

  return {
    agencyId: u.agencyId,
  };
}

const safe = (document: { toJSON(): unknown }) =>
  document.toJSON();

export async function listMessagesForAgency(
  u: SafeUser,
) {
  const { agencyId } = agencyScope(u);

  const items = await MessageModel.find({
    agencyId,
  })
    .populate(
      "telecallerId",
      "name email phone status",
    )
    .sort({ createdAt: -1 });

  return {
    items: items.map(safe),
  };
}

export async function readMessageForAgency(
  u: SafeUser,
  id: string,
) {
  const { agencyId } = agencyScope(u);

  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "Message not found");
  }

  const message = await MessageModel.findOne({
    _id: id,
    agencyId,
  }).populate(
    "telecallerId",
    "name email phone status",
  );

  if (!message) {
    throw new AppError(404, "Message not found");
  }

  if (!message.readAt) {
    message.readAt = new Date();
    await message.save();
  }

  return safe(message);
}

export async function deleteMessageForAgency(
  u: SafeUser,
  id: string,
) {
  const { agencyId } = agencyScope(u);

  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "Message not found");
  }

  const message = await MessageModel.findOneAndDelete({
    _id: id,
    agencyId,
  });

  if (!message) {
    throw new AppError(404, "Message not found");
  }

  return {
    id: String(message._id),
  };
}