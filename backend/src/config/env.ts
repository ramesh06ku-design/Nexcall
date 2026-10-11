import { config as loadEnv } from "dotenv";
import path from "node:path";
import { z } from "zod";

// Resolve from this module so workspace commands load backend/.env regardless
// of whether npm was started from the repository root or the backend folder.
loadEnv({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);
const optionalEmail = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.email().optional(),
);
const optionalPassword = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(8).optional(),
);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  FRONTEND_URL: z.url().default("http://localhost:3000"),
  BACKEND_URL: z.url().default("http://localhost:4000"),
  PORT: z.coerce.number().int().positive().default(4000),
  COOKIE_DOMAIN: optionalString,
  ADMIN_NAME: optionalString,
  ADMIN_EMAIL: optionalEmail,
  ADMIN_PASSWORD: optionalPassword,
  DEMO_PASSWORD: optionalPassword,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
