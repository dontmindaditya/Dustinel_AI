import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { env } from "../config/env";
import { UnauthorizedError } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        name: string;
        role: string;
        organizationId: string;
        workerId?: string;
      };
    }
  }
}

// Build JWKS URI for Azure AD B2C
function getJwksUri(): string {
  return (
    `https://${env.AZURE_AD_B2C_TENANT}/${env.AZURE_AD_B2C_TENANT_ID}/` +
    `${env.AZURE_AD_B2C_USER_FLOW}/discovery/v2.0/keys`
  );
}

const jwksClient = jwksRsa({
  jwksUri: getJwksUri(),
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    jwksClient.getSigningKey(header.kid!, (err, key) => {
      if (err) return reject(err);
      resolve(key!.getPublicKey());
    });
  });
}

/**
 * Validates Azure AD B2C JWT token.
 * Attaches decoded user claims to req.user.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or invalid Authorization header"));
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await new Promise<any>((resolve, reject) => {
      jwt.verify(
        token,
        async (header, callback) => {
          try {
            const key = await getSigningKey(header);
            callback(null, key);
          } catch (err) {
            callback(err as Error);
          }
        },
        {
          audience: env.AZURE_AD_B2C_CLIENT_ID,
          issuer: `https://${env.AZURE_AD_B2C_TENANT}/${env.AZURE_AD_B2C_TENANT_ID}/v2.0/`,
          algorithms: ["RS256"],
        },
        (err, payload) => {
          if (err) reject(err);
          else resolve(payload);
        }
      );
    });

    req.user = {
      sub: decoded.sub,
      email: decoded.email || decoded.emails?.[0] || "",
      name: decoded.name || decoded.given_name || "",
      role: decoded.extension_role || decoded.role || "worker",
      organizationId: decoded.extension_organizationId || decoded.organizationId || "",
      workerId: decoded.extension_workerId || decoded.workerId,
    };

    next();
  } catch (err: any) {
    logger.warn("JWT validation failed", { error: err.message });
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

/**
 * Development-only bypass — lets you pass a demo user header.
 * NEVER use in production.
 */
export function devAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (env.NODE_ENV !== "development") return next(new UnauthorizedError());

  req.user = {
    sub: "dev-user-001",
    email: "dev@safeguard.local",
    name: "Dev User",
    role: req.headers["x-dev-role"]?.toString() || "worker",
    organizationId: "org_minecorp",
    workerId: "worker_001",
  };
  next();
}