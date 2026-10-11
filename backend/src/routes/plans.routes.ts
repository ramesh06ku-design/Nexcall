import { Router } from "express";
import { foundationController } from "../controllers/foundation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
const router = Router();
router.use(authenticate, authorize("admin"));
router.get("/", foundationController("plans"));
export default router;
