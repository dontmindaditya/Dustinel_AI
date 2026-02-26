import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/asyncHandler";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Use memory storage — we stream directly to Azure Blob Storage
const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP`,
        400,
        "INVALID_FILE_TYPE"
      )
    );
  }
}

export const uploadSingle = (fieldName: string) =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  }).single(fieldName);

export const uploadMultiple = (fields: { name: string; maxCount: number }[]) =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  }).fields(fields);