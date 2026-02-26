import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default("5000").transform(Number),
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),

  // Azure AD B2C
  AZURE_AD_B2C_TENANT: z.string(),
  AZURE_AD_B2C_TENANT_ID: z.string(),
  AZURE_AD_B2C_CLIENT_ID: z.string(),
  AZURE_AD_B2C_USER_FLOW: z.string().default("B2C_1_signupsignin"),

  // Azure AI Vision
  AZURE_VISION_ENDPOINT: z.string().url(),
  AZURE_VISION_KEY: z.string(),

  // Azure Blob Storage
  AZURE_STORAGE_ACCOUNT_NAME: z.string(),
  AZURE_STORAGE_CONNECTION_STRING: z.string(),
  AZURE_STORAGE_CONTAINER_NAME: z.string().default("safeguard-images"),

  // Azure Cosmos DB
  COSMOS_ENDPOINT: z.string().url(),
  COSMOS_KEY: z.string(),
  COSMOS_DATABASE_NAME: z.string().default("safeguardai"),

  // Azure ML
  AZURE_ML_ENDPOINT: z.string().url(),
  AZURE_ML_API_KEY: z.string(),

  // Azure Notification Hubs
  NOTIFICATION_HUB_CONNECTION_STRING: z.string(),
  NOTIFICATION_HUB_NAME: z.string(),

  // Azure Communication Services
  AZURE_COMMUNICATION_CONNECTION_STRING: z.string(),
  AZURE_COMMUNICATION_SENDER_EMAIL: z.string().email(),
  AZURE_COMMUNICATION_SENDER_PHONE: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("60000").transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),
  CHECKIN_RATE_LIMIT_MAX: z.string().default("10").transform(Number),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = validateEnv();
export type Env = typeof env;