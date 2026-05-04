import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import sharp from "sharp";
import { authMiddleware } from "../middleware/auth";
import { minioClient, MINIO_BUCKET, ensureBucket as ensureMinioBucket, presignAvatarUrl } from "../lib/minio";
import { prisma } from "../lib/prisma";

const router = Router();

const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много загрузок. Попробуйте через минуту." },
});

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB for avatars
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only jpg, png, webp allowed for avatars"));
    }
  },
});

// Whitelist of allowed document MIME types. Mirrors the chat-file
// allow list so uploaded attachments are uniformly validated regardless
// of which entrypoint they came through.
const DOCUMENT_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/x-7z-compressed",
];

const DOCUMENT_MAX_FILE_BYTES = 100 * 1024 * 1024; // 100MB per file

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: DOCUMENT_MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (DOCUMENT_ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Недопустимый тип файла"));
    }
  },
});

// Hourly anon upload cap per IP — keeps the anonymous endpoint from being
// abused as free storage. Standard Express rate limiter, separate window
// from the normal authenticated uploadRateLimiter.
const anonUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много анонимных загрузок. Попробуйте позже." },
});

const ANON_FILE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const ANON_MAX_FILES_PER_SESSION = 5;

// Map of trusted MIME types → canonical safe extensions used for the
// MinIO storage key. Avoids carrying through user-supplied extensions
// like ".exe.pdf" or ".php" — the storage key extension is fully
// derived from the validated mimetype.
const MIME_EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/plain": ".txt",
};

/**
 * Sanitize a user-supplied filename for response payloads (NOT for storage keys):
 *   - strip path separators / traversal
 *   - allow only [a-zA-Z0-9._-] + cyrillic + spaces
 *   - collapse repeated separators
 *   - clamp to 120 chars
 */
function sanitizeFilename(name: string): string {
  const base = name.replace(/[\\/]/g, "_").replace(/\.\./g, "_");
  const safe = base.replace(/[^a-zA-Z0-9._\-Ѐ-ӿ\s]/g, "_").trim();
  const collapsed = safe.replace(/_+/g, "_").replace(/\s+/g, " ");
  return collapsed.slice(0, 120) || "file";
}

/**
 * Generate a UUID-only storage key. The user-supplied filename is NEVER
 * used as part of the MinIO key — extension is derived from the validated
 * mimetype (mimeType is checked against multer fileFilter before this is
 * called). Falls back to original ext only if mimetype unmapped.
 */
function generateKey(folder: string, originalName: string, mimeType?: string): string {
  let ext = mimeType && MIME_EXT_MAP[mimeType] ? MIME_EXT_MAP[mimeType] : path.extname(originalName).toLowerCase();
  // Defensive: only allow safe ext characters
  if (!/^\.[a-z0-9]{1,6}$/.test(ext)) ext = "";
  const id = crypto.randomUUID();
  return `${folder}/${Date.now()}-${id}${ext}`;
}

// POST /api/upload/avatar — upload avatar image
router.post("/avatar", authMiddleware, uploadRateLimiter, avatarUpload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    await ensureMinioBucket();

    // UUID-only storage key, ext derived from validated mimetype.
    const key = generateKey("avatars", req.file.originalname, "image/jpeg");

    // Avatars only ever render at ≤160px (xxl on hero) and ≤96px on
    // catalog cards. 256px gives ~1.6× retina headroom; bigger was wire-
    // weight for nothing. fit:'cover' crops to a real square so non-
    // square uploads no longer render with whitespace inside the round
    // mask. JPEG q80 (mozjpeg) is visually indistinguishable from q85
    // but ~20% smaller.
    const { data: resized, info } = await sharp(req.file.buffer)
      .resize(256, 256, { fit: "cover", position: "attention" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    await minioClient.putObject(MINIO_BUCKET, key, resized, info.size, {
      "Content-Type": "image/jpeg",
    });

    // Save the storage key in user.avatarUrl so URLs never expire in the DB.
    // Return a 7-day presigned URL (S3 max) for immediate display in <Image>.
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { avatarUrl: key },
    });

    const url = await presignAvatarUrl(key);
    res.json({ url, key });
  } catch (error) {
    console.error("avatar upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// POST /api/upload/documents — upload document files (max 10).
// Limit raised from 5 → 10 to match the chat composer (#bug 3).
// Creates a DB File record for each upload and returns its id so the
// caller can link it to a request via POST /api/requests (fileIds param).
router.post("/documents", authMiddleware, uploadRateLimiter, documentUpload.array("files", 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files provided" });
      return;
    }

    await ensureMinioBucket();

    const userId = req.user!.userId;
    const results = [];
    for (const file of files) {
      // Storage key: UUID-only (extension derived from validated mimetype),
      // never user-supplied filename. Display name is sanitized for return
      // payload + DB persistence — strips path traversal and unsafe chars.
      const safeFilename = sanitizeFilename(file.originalname);
      const key = generateKey("documents", file.originalname, file.mimetype);
      await minioClient.putObject(MINIO_BUCKET, key, file.buffer, file.size, {
        "Content-Type": file.mimetype,
      });
      // Create a File record so the upload can be linked to a request later via fileIds.
      // entityType/entityId are placeholders ("user" + userId) until the request is created.
      const record = await prisma.file.create({
        data: {
          entityType: "user",
          entityId: userId,
          url: `/${MINIO_BUCKET}/${key}`,
          filename: safeFilename,
          size: file.size,
          mimeType: file.mimetype,
        },
      });

      results.push({
        id: record.id,
        url: record.url,
        key,
        filename: record.filename,
        size: record.size,
        mimeType: record.mimeType,
      });
    }

    res.json({ files: results });
  } catch (error) {
    console.error("documents upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// POST /api/upload/anon-documents — anonymous document upload bound to a
// client-generated sessionId. Files are written to MinIO immediately but
// the DB row carries an `expiresAt` set to NOW()+24h. When the visitor
// later submits a request via OTP, /api/requests claims them by sessionId
// (clears expiresAt + sets requestId). A periodic cleanup job removes
// rows where requestId IS NULL AND expiresAt < now() and deletes their
// MinIO objects. See p2ptax-anon-cleanup systemd timer.
router.post(
  "/anon-documents",
  anonUploadRateLimiter,
  documentUpload.array("files", ANON_MAX_FILES_PER_SESSION),
  async (req: Request, res: Response) => {
    try {
      const sessionId = (req.body?.sessionId as string | undefined)?.trim();
      if (!sessionId || sessionId.length < 16 || sessionId.length > 128) {
        res.status(400).json({ error: "sessionId is required" });
        return;
      }
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        res.status(400).json({ error: "No files provided" });
        return;
      }

      // Cap on cumulative session size — prevents an attacker spamming many
      // uploads with the same sessionId to fill disk.
      const existingCount = await prisma.file.count({
        where: { sessionId, requestId: null },
      });
      if (existingCount + files.length > ANON_MAX_FILES_PER_SESSION) {
        res.status(400).json({
          error: `Максимум ${ANON_MAX_FILES_PER_SESSION} файлов в сессии`,
        });
        return;
      }

      await ensureMinioBucket();

      const expiresAt = new Date(Date.now() + ANON_FILE_TTL_MS);
      const results = [];
      for (const file of files) {
        const safeFilename = sanitizeFilename(file.originalname);
        const key = generateKey("anon-uploads", file.originalname, file.mimetype);
        await minioClient.putObject(MINIO_BUCKET, key, file.buffer, file.size, {
          "Content-Type": file.mimetype,
        });
        const record = await prisma.file.create({
          data: {
            entityType: "anon",
            entityId: sessionId,
            sessionId,
            expiresAt,
            url: `/${MINIO_BUCKET}/${key}`,
            filename: safeFilename,
            size: file.size,
            mimeType: file.mimetype,
          },
        });
        results.push({
          id: record.id,
          url: record.url,
          filename: record.filename,
          size: record.size,
          mimeType: record.mimeType,
        });
      }

      res.json({ files: results, expiresAt });
    } catch (error) {
      console.error("anon-documents upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// POST /api/upload/chat-file — upload a single chat attachment with idempotency token
// Body (multipart): file + uploadToken (UUID) + threadId
const chatFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      // Images
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // Text
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Недопустимый тип файла. Разрешены: изображения, PDF, Word, Excel, TXT"));
    }
  },
});

router.post("/chat-file", authMiddleware, uploadRateLimiter, chatFileUpload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const { uploadToken, threadId } = req.body as { uploadToken?: string; threadId?: string };

    if (!uploadToken || typeof uploadToken !== "string" || uploadToken.length < 8) {
      res.status(400).json({ error: "uploadToken is required" });
      return;
    }

    // threadId is OPTIONAL — when omitted, the upload goes to a "_pending" namespace
    // so the file can be linked later when the thread is created (specialist's first response).
    const hasThread = typeof threadId === "string" && threadId.length > 0;

    await ensureMinioBucket();

    // Sanitized display name (returned to clients, used to derive the
    // resolveUploadToken filename in messages.ts).
    const safeName = sanitizeFilename(req.file.originalname);
    // Storage key uses uploadToken + sanitized name (not the raw originalname)
    // so adversarial filenames cannot escape the chat-files/<thread>/ prefix.
    const key = hasThread
      ? `chat-files/${threadId}/${uploadToken}_${safeName}`
      : `chat-files/_pending/${uploadToken}_${safeName}`;

    await minioClient.putObject(MINIO_BUCKET, key, req.file.buffer, req.file.size, {
      "Content-Type": req.file.mimetype,
    });

    res.json({
      uploadToken,
      fileUrl: `/${MINIO_BUCKET}/${key}`,
      fileName: safeName,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error("chat-file upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// GET /api/upload/signed-url/:key — get signed URL (auth required)
router.get("/signed-url/:key(*)", authMiddleware, async (req: Request, res: Response) => {
  try {
    const rawKey = req.params.key;
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const url = await minioClient.presignedGetObject(MINIO_BUCKET, key, 60 * 60);
    res.json({ url });
  } catch (error) {
    console.error("get file error:", error);
    res.status(500).json({ error: "Failed to get file URL" });
  }
});

/**
 * Router-scoped error handler. Multer raises:
 *   - MulterError("LIMIT_FILE_SIZE") when the configured fileSize limit is exceeded
 *   - generic Error from fileFilter for unsupported MIME types
 * Map both to client-readable status codes (413 / 415) so the UI can show
 * a precise message instead of a generic 500.
 */
router.use((err: unknown, _req: Request, res: Response, next: (err?: unknown) => void) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "Файл превышает 10 МБ" });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof Error && /Недопустимый тип файла|allowed/i.test(err.message)) {
    res.status(415).json({ error: err.message });
    return;
  }
  next(err);
});

export default router;
