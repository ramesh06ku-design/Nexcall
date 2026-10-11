import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { UserModel, type UserDocument } from "../models/User.js";
import type { SafeUser } from "../types/domain.js";
import { AppError } from "../utils/AppError.js";
import { createTelecallerForAgency, getTelecallerForAgency, updateTelecallerForAgency } from "./telecaller.service.js";

const agencyUser: SafeUser = {
  id: new Types.ObjectId().toString(),
  name: "Agency Owner",
  email: "owner@example.com",
  role: "agency",
  agencyId: new Types.ObjectId().toString(),
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
};

test("telecaller tenant ownership comes from the authenticated agency", async () => {
  const model = UserModel as unknown as {
    exists: (filter: unknown) => Promise<unknown>;
    create: (document: Record<string, unknown>) => Promise<UserDocument>;
  };
  const originalExists = model.exists;
  const originalCreate = model.create;
  let savedDocument: Record<string, unknown> | undefined;

  model.exists = async () => null;
  model.create = async (document) => {
    savedDocument = document;
    return new UserModel({
      ...document,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  try {
    const result = await createTelecallerForAgency(agencyUser, {
      name: "New Caller",
      email: "caller@example.com",
      password: "password123",
      // Simulates a malicious extra field that bypassed frontend typing.
      agencyId: new Types.ObjectId().toString(),
    } as Parameters<typeof createTelecallerForAgency>[1]);

    assert.equal(savedDocument?.agencyId, agencyUser.agencyId);
    assert.equal(savedDocument?.role, "telecaller");
    assert.equal("passwordHash" in result, false);
  } finally {
    model.exists = originalExists;
    model.create = originalCreate;
  }
});

test("non-agency users cannot create telecallers", async () => {
  await assert.rejects(
    () =>
      createTelecallerForAgency(
        { ...agencyUser, role: "admin", agencyId: null },
        { name: "Caller", email: "caller@example.com", password: "password123" },
      ),
    (error: unknown) => error instanceof AppError && error.statusCode === 403,
  );
});

test("detail lookup is constrained to the authenticated agency", async () => {
  const model = UserModel as unknown as { findOne: (filter: unknown) => Promise<null> };
  const original = model.findOne;
  let received: Record<string, unknown> | undefined;
  model.findOne = async (filter) => { received = filter as Record<string, unknown>; return null; };
  try {
    await assert.rejects(() => getTelecallerForAgency(agencyUser, new Types.ObjectId().toString()), (error: unknown) => error instanceof AppError && error.statusCode === 404);
    assert.equal(received?.agencyId, agencyUser.agencyId);
    assert.equal(received?.role, "telecaller");
  } finally { model.findOne = original; }
});

test("updates cannot escape the authenticated agency tenant", async () => {
  const model = UserModel as unknown as { findOneAndUpdate: (filter: unknown, update: unknown, options: unknown) => Promise<null> };
  const original = model.findOneAndUpdate;
  let received: Record<string, unknown> | undefined;
  model.findOneAndUpdate = async (filter) => { received = filter as Record<string, unknown>; return null; };
  try {
    await assert.rejects(() => updateTelecallerForAgency(agencyUser, new Types.ObjectId().toString(), { status: "inactive" }), (error: unknown) => error instanceof AppError && error.statusCode === 404);
    assert.equal(received?.agencyId, agencyUser.agencyId);
    assert.equal(received?.role, "telecaller");
  } finally { model.findOneAndUpdate = original; }
});
