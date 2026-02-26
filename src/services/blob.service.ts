import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { getBlobServiceClient } from "../config/azure.config";
import { logger } from "../utils/logger";
import { AppError } from "../utils/asyncHandler";

const SAS_EXPIRY_MINUTES = 5;

export interface SasUrlResult {
  sasUrl: string;
  blobUrl: string;
  expiresAt: string;
}

function buildBlobPath(
  type: "face" | "environment",
  organizationId: string,
  workerId: string,
  timestamp: number
): string {
  if (type === "face") {
    return `face/${organizationId}/${workerId}/${timestamp}.jpg`;
  }
  return `environment/${organizationId}/${workerId}/${timestamp}.jpg`;
}

export const blobService = {
  /**
   * Generates a SAS URL with write-only permission.
   * Client uploads directly to Azure Blob Storage — image never passes through backend.
   */
  async generateSasUrl(params: {
    type: "face" | "environment";
    workerId: string;
    organizationId: string;
  }): Promise<SasUrlResult> {
    const { type, workerId, organizationId } = params;
    const timestamp = Date.now();
    const blobPath = buildBlobPath(type, organizationId, workerId, timestamp);

    const containerClient = getBlobServiceClient().getContainerClient(
      env.AZURE_STORAGE_CONTAINER_NAME
    );
    const blobClient = containerClient.getBlobClient(blobPath);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + SAS_EXPIRY_MINUTES);

    const sasToken = await blobClient.generateSasUrl({
      permissions: BlobSASPermissions.parse("cw"), // create + write
      expiresOn: expiresAt,
      contentType: "image/jpeg",
    });

    const blobUrl = `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${env.AZURE_STORAGE_CONTAINER_NAME}/${blobPath}`;

    logger.debug("SAS URL generated", { type, workerId, expiresAt });

    return {
      sasUrl: sasToken,
      blobUrl,
      expiresAt: expiresAt.toISOString(),
    };
  },

  /**
   * Upload a buffer directly to Blob Storage (used for server-side uploads if needed).
   */
  async uploadBuffer(params: {
    buffer: Buffer;
    blobPath: string;
    contentType?: string;
  }): Promise<string> {
    const { buffer, blobPath, contentType = "image/jpeg" } = params;
    const containerClient = getBlobServiceClient().getContainerClient(
      env.AZURE_STORAGE_CONTAINER_NAME
    );

    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    const url = blockBlobClient.url;
    logger.debug("Blob uploaded", { blobPath, size: buffer.length });
    return url;
  },

  /**
   * Delete a blob by its full URL or path.
   */
  async deleteBlob(blobPath: string): Promise<void> {
    const containerClient = getBlobServiceClient().getContainerClient(
      env.AZURE_STORAGE_CONTAINER_NAME
    );
    const blobClient = containerClient.getBlobClient(blobPath);
    await blobClient.deleteIfExists();
    logger.debug("Blob deleted", { blobPath });
  },
};