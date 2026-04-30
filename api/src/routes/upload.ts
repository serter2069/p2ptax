import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import sharp from "sharp";
import { authMiddleware } from "../middleware/auth";
import { minioClient, MINIO_BUCKET, ensureBucket as ensureMinioBucket } from "../lib/minio";
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

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for documents
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only pdf, jpg, png allowed for documents"));
    }
  },
});

function generateKey(folder: string, originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(8).toString("hex");
  return `${folder}/${Date.now()}-${hash}${ext}`;
}

// POST /api/upload/avatar — upload avatar image
router.post("/avatar", authMiddleware, uploadRateLimiter, avatarUpload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    await ensureMinioBucket();

    const key = generateKey("avatars", req.file.originalname);

    // Resize avatar to 400x400 max (fit, preserving aspect ratio) and convert to JPEG
    const { data: resized, info } = await sharp(req.file.buffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    await minioClient.putObject(MINIO_BUCKET, key, resized, info.size, {
      "Content-Type": "image/jpeg",
    });

    // Return 1-year presigned URL so the avatar is directly usable in <Image>.
    // The raw key is also returned so callers can re-presign on future loads.
    const url = await minioClient.presignedGetObject(MINIO_BUCKET, key, 365 * 24 * 60 * 60);
    res.json({ url, key });
  } catch (error) {
    console.error("avatar upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// POST /api/upload/documents — upload document files (max 5)
router.post("/documents", authMiddleware, uploadRateLimiter, documentUpload.array("files", 5), async (req: Request, res: Response) => {
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
      const key = generateKey("documents", file.originalname);
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
          filename: file.originalname,
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

    // Sanitize filename: replace unsafe chars, preserve extension
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = hasThread
      ? `chat-files/${threadId}/${uploadToken}_${safeName}`
      : `chat-files/_pending/${uploadToken}_${safeName}`;

    await minioClient.putObject(MINIO_BUCKET, key, req.file.buffer, req.file.size, {
      "Content-Type": req.file.mimetype,
    });

    res.json({
      uploadToken,
      fileUrl: `/${MINIO_BUCKET}/${key}`,
      fileName: req.file.originalname,
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

export default router;
