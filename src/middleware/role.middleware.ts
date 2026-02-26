import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/asyncHandler";

type Role = "worker" | "supervisor" | "admin";

const roleHierarchy: Record<Role, number> = {
  worker: 1,
  supervisor: 2,
  admin: 3,
};

/**
 * Requires that the authenticated user has at least the specified role.
 * Usage: router.get("/admin/dashboard", requireRole("supervisor"), ...)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as Role | undefined;
    if (!userRole) {
      return next(new ForbiddenError("No role assigned to user"));
    }

    const userLevel = roleHierarchy[userRole] ?? 0;
    const hasPermission = allowedRoles.some(
      (role) => userLevel >= roleHierarchy[role]
    );

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `This endpoint requires one of: ${allowedRoles.join(", ")}`
        )
      );
    }

    next();
  };
}

/**
 * Workers can only access their own data unless they are admin/supervisor.
 * Usage: router.get("/workers/:id", ownDataOrAdmin)
 */
export function ownDataOrAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const userRole = req.user?.role as Role | undefined;
  const userWorkerId = req.user?.workerId;
  const paramId = req.params.id;

  const isElevated = userRole === "admin" || userRole === "supervisor";
  const isOwn = userWorkerId && userWorkerId === paramId;

  if (isElevated || isOwn) return next();

  next(new ForbiddenError("You can only access your own data"));
}