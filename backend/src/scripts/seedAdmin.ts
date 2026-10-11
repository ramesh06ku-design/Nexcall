import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { UserModel } from "../models/User.js";

async function seed() {
  if (!env.ADMIN_NAME || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD before seeding");
  }
  await connectDatabase();
  const email = env.ADMIN_EMAIL.toLowerCase();
  const existingAdmin = await UserModel.findOne({ role: "admin" }).select("email").lean();
  if (existingAdmin) {
    console.info(`An admin already exists: ${existingAdmin.email}. No changes were made.`);
    return;
  }
  const emailOwner = await UserModel.findOne({ email }).select("role").lean();
  if (emailOwner) {
    throw new Error("The configured ADMIN_EMAIL already belongs to a non-admin account");
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await UserModel.create({
    name: env.ADMIN_NAME,
    email,
    passwordHash,
    role: "admin",
    agencyId: null,
    status: "active",
  });
  console.info(`Admin account created: ${email}`);
}

seed()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Admin seed failed");
    process.exitCode = 1;
  })
  .finally(() => void disconnectDatabase());
