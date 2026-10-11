import { Router } from "express";
import { z } from "zod";
import {
  loginController,
  logoutController,
  meController,
  signupController,
  workerLoginController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const passwordSchema = z.string().min(8, "Password must contain at least 8 characters").max(72);
const signupSchema = z
  .object({
    agencyName: z.string().trim().min(2).max(120),
    ownerName: z.string().trim().min(2).max(100),
    email: z.email().transform((value) => value.toLowerCase()),
    phone: z.string().trim().min(7).max(25).optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .transform(({ confirmPassword: _confirmPassword, phone, ...values }) => ({
    ...values,
    ...(phone ? { phone } : {}),
  }));

const loginSchema = z
  .object({
    email: z.email().transform((value) => value.toLowerCase()),
    password: passwordSchema,
  })
  .strict();

const workerLoginSchema = z
  .object({
    identifier: z.string().trim().min(3).max(120),
    password: passwordSchema,
  })
  .strict();

const router = Router();
router.post("/signup", validateBody(signupSchema), asyncHandler(signupController));
router.post("/login", validateBody(loginSchema), asyncHandler(loginController));
router.post(
  "/worker-login",
  validateBody(workerLoginSchema),
  asyncHandler(workerLoginController),
);
router.post("/logout", logoutController);
router.get("/me", authenticate, asyncHandler(meController));

export default router;
