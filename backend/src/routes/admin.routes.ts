import { Router } from "express";
import { adminDashboard } from "../controllers/admin-dashboard.controller.js";
import {
  adminAgencies,
  adminAgencyDetails,
  adminUpdateAgencyStatus,
  adminAssignAgencyPlan,
} from "../controllers/admin-agencies.controller.js";
import { adminAnalytics } from "../controllers/admin-analytics.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { foundationController } from "../controllers/foundation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import {
  adminPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminUpdatePlanStatus,
} from "../controllers/admin-plans.controller.js";
import {
  adminNotifications,
  adminMarkNotificationRead,
  adminMarkAllNotificationsRead,
} from "../controllers/admin-notifications.controller.js";
import { z } from "zod";
import { validateBody } from "../middleware/validate.js";

import {
  adminUpdateProfile,
  adminChangePassword,
} from "../controllers/admin-settings.controller.js";

const adminProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
  })
  .strict();

const adminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
  })
  .strict();

const router = Router();
router.use(authenticate, authorize("admin"));
router.get("/", foundationController("admin"));
router.patch(
  "/settings/profile",
  validateBody(adminProfileSchema),
  asyncHandler(adminUpdateProfile),
);

router.patch(
  "/settings/password",
  validateBody(adminPasswordSchema),
  asyncHandler(adminChangePassword),
);
router.get(
  "/dashboard",
  asyncHandler(adminDashboard),
);

router.get(
  "/analytics",
  asyncHandler(adminAnalytics),
);

router.get(
  "/notifications",
  asyncHandler(adminNotifications),
);

router.patch(
  "/notifications/read-all",
  asyncHandler(adminMarkAllNotificationsRead),
);

router.patch(
  "/notifications/:id/read",
  asyncHandler(adminMarkNotificationRead),
);

router.get(
  "/plans",
  asyncHandler(adminPlans),
);

router.post(
  "/plans",
  asyncHandler(adminCreatePlan),
);

router.patch(
  "/plans/:id",
  asyncHandler(adminUpdatePlan),
);

router.patch(
  "/plans/:id/status",
  asyncHandler(adminUpdatePlanStatus),
);

router.get(
  "/agencies",
  asyncHandler(adminAgencies),
);



router.get(
  "/agencies/:id",
  asyncHandler(adminAgencyDetails),
);
router.patch(
  "/agencies/:id/status",
  asyncHandler(adminUpdateAgencyStatus),
);

router.patch(
  "/agencies/:id/plan",
  asyncHandler(adminAssignAgencyPlan),
);
export default router;
