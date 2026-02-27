import { BlobServiceClient } from "@azure/storage-blob";
import { CosmosClient } from "@azure/cosmos";
import { NotificationHubsClient } from "@azure/notification-hubs";
import { env } from "./env";

// ─── Blob Storage ────────────────────────────────────────────────────────────
let _blobServiceClient: BlobServiceClient | null = null;

export function getBlobServiceClient(): BlobServiceClient {
  if (!_blobServiceClient) {
    _blobServiceClient = BlobServiceClient.fromConnectionString(
      env.AZURE_STORAGE_CONNECTION_STRING
    );
  }
  return _blobServiceClient;
}

export function getContainerClient(containerName = env.AZURE_STORAGE_CONTAINER_NAME) {
  return getBlobServiceClient().getContainerClient(containerName);
}

// ─── Cosmos DB ───────────────────────────────────────────────────────────────
let _cosmosClient: CosmosClient | null = null;

export function getCosmosClient(): CosmosClient {
  if (!_cosmosClient) {
    _cosmosClient = new CosmosClient({
      endpoint: env.COSMOS_ENDPOINT,
      key: env.COSMOS_KEY,
    });
  }
  return _cosmosClient;
}

export function getDatabase() {
  return getCosmosClient().database(env.COSMOS_DATABASE_NAME);
}

export function getContainer(containerName: string) {
  return getDatabase().container(containerName);
}

// Cosmos DB container names
export const CONTAINERS = {
  WORKERS: "workers",
  HEALTH_RECORDS: "healthRecords",
  ALERTS: "alerts",
  ORGANIZATIONS: "organizations",
} as const;

// ─── Notification Hubs ───────────────────────────────────────────────────────
let _notificationHubsClient: NotificationHubsClient | null = null;

export function getNotificationHubsClient(): NotificationHubsClient {
  if (!_notificationHubsClient) {
    _notificationHubsClient = new NotificationHubsClient(
      env.NOTIFICATION_HUB_CONNECTION_STRING,
      env.NOTIFICATION_HUB_NAME
    );
  }
  return _notificationHubsClient;
}

// ─── Azure AI Vision config ───────────────────────────────────────────────────
export const visionConfig = {
  endpoint: env.AZURE_VISION_ENDPOINT,
  key: env.AZURE_VISION_KEY,
  provider: env.VISION_PROVIDER,
  ppeModelEndpoint: env.AZURE_PPE_MODEL_ENDPOINT,
  ppeModelApiKey: env.AZURE_PPE_MODEL_API_KEY,
  dustModelEndpoint: env.AZURE_DUST_MODEL_ENDPOINT,
  dustModelApiKey: env.AZURE_DUST_MODEL_API_KEY,
};

// ─── Azure ML config ──────────────────────────────────────────────────────────
export const mlConfig = {
  endpoint: env.AZURE_ML_ENDPOINT,
  apiKey: env.AZURE_ML_API_KEY,
};
