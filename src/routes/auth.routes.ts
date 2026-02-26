import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { authRateLimit } from "../middleware/rateLimit.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/login", authRateLimit, authMiddleware as any, asyncHandler(authController.login));
router.get("/me", authMiddleware as any, asyncHandler(authController.getMe));
router.post("/logout", authMiddleware as any, asyncHandler(authController.logout));

export default router;
