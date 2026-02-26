import { getSession } from "next-auth/react";
import { ROUTES } from "./constants";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "worker" | "supervisor" | "admin";
  organizationId: string;
  accessToken: string;
}

export async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  return (session as any)?.accessToken ?? null;
}

export function getRedirectByRole(role: string): string {
  if (role === "admin" || role === "supervisor") return ROUTES.ADMIN_DASHBOARD;
  return ROUTES.WORKER_DASHBOARD;
}

export function isAdmin(role: string): boolean {
  return role === "admin" || role === "supervisor";
}

export function isWorker(role: string): boolean {
  return role === "worker";
}

// Azure AD B2C config
export const b2cConfig = {
  tenant: process.env.NEXT_PUBLIC_B2C_TENANT || "",
  clientId: process.env.NEXT_PUBLIC_B2C_CLIENT_ID || "",
  userFlow: process.env.NEXT_PUBLIC_B2C_USER_FLOW || "B2C_1_signupsignin",
  scopes: [
    "openid",
    "offline_access",
    `api://${process.env.NEXT_PUBLIC_B2C_CLIENT_ID}/checkin.write`,
    `api://${process.env.NEXT_PUBLIC_B2C_CLIENT_ID}/admin.read`,
  ],
};