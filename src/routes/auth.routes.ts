import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { authRateLimit } from "../middleware/rateLimit.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/login", authRateLimit, authMiddleware, asyncHandler(authController.login));
router.get("/me", authMiddleware, asyncHandler(authController.getMe));
router.post("/logout", authMiddleware, asyncHandler(authController.logout));

export default router;
