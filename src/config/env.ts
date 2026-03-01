import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const runtimeNodeEnv = (process.env.NODE_ENV as "development" | "staging" | "production" | undefined) ?? "development";
const isProdLike = runtimeNodeEnv === "staging" || runtimeNodeEnv === "production";

const requiredString = (fallback: string) =>
  isProdLike ? z.string().min(1) : z.string().default(fallback);

const requiredUrl = (fallback: string) =>
  isProdLike ? z.string().url() : z.string().url().default(fallback);

const envSchema = z.object({
  // Server
  PORT: z.string().default("5000").transform(Number),
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  AUTH_PROVIDER: z.enum(["mock", "azure"]).default(runtimeNodeEnv === "development" ? "mock" : "azure"),

  // Azure AD B2C
  AZURE_AD_B2C_TENANT: requiredString("example.b2clogin.com"),
  AZURE_AD_B2C_TENANT_ID: requiredString("example.onmicrosoft.com"),
  AZURE_AD_B2C_CLIENT_ID: requiredString("dev-client-id"),
  AZURE_AD_B2C_USER_FLOW: z.string().default("B2C_1_signupsignin"),

  // Azure AI Vision
  AZURE_VISION_ENDPOINT: requiredUrl("https://example.cognitiveservices.azure.com"),
  AZURE_VISION_KEY: requiredString("dev-vision-key"),
  VISION_PROVIDER: z.enum(["azure_vision", "hybrid", "research_only"]).default("hybrid"),

  // Optional research model endpoints (Azure ML / managed inference)
  AZURE_PPE_MODEL_ENDPOINT: z.string().url().optional(),
  AZURE_PPE_MODEL_API_KEY: z.string().optional(),
  AZURE_DUST_MODEL_ENDPOINT: z.string().url().optional(),
  AZURE_DUST_MODEL_API_KEY: z.string().optional(),

  // Azure Blob Storage
  AZURE_STORAGE_ACCOUNT_NAME: requiredString("devstorageaccount1"),
  AZURE_STORAGE_CONNECTION_STRING: requiredString("UseDevelopmentStorage=true"),
  AZURE_STORAGE_CONTAINER_NAME: z.string().default("safeguard-images"),

  // Azure Cosmos DB
  COSMOS_ENDPOINT: requiredUrl("https://localhost:8081"),
  COSMOS_KEY: requiredString("dev-cosmos-key"),
  COSMOS_DATABASE_NAME: z.string().default("safeguardai"),

  // Azure ML
  AZURE_ML_ENDPOINT: requiredUrl("https://example.inference.ml.azure.com/score"),
  AZURE_ML_API_KEY: requiredString("dev-ml-key"),

  // Azure Notification Hubs
  NOTIFICATION_HUB_CONNECTION_STRING: requiredString("Endpoint=sb://example/"),
  NOTIFICATION_HUB_NAME: requiredString("safeguard-notifications"),

  // Azure Communication Services
  AZURE_COMMUNICATION_CONNECTION_STRING: requiredString("endpoint=https://example.communication.azure.com/;accesskey=dev"),
  AZURE_COMMUNICATION_SENDER_EMAIL: isProdLike
    ? z.string().email()
    : z.string().email().default("noreply@safeguard.local"),
  AZURE_COMMUNICATION_SENDER_PHONE: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("60000").transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),
  CHECKIN_RATE_LIMIT_MAX: z.string().default("10").transform(Number),

  // Profile settings
  PROFILE_IMAGE_MAX_MB: z.string().default("5").transform(Number),
  PROFILE_ALLOWED_IMAGE_TYPES: z
    .string()
    .default("image/jpeg,image/png,image/webp"),
  PROFILE_DEFAULT_AVATAR_URL: z.string().url().optional(),
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
