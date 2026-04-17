import { Router, Request, Response } from "express";
import multer from "multer";
import * as Minio from "minio";
import crypto from "crypto";
import path from "path";
import { authMiddleware } from "../middleware/auth";

const router = Router();

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

function getMinioClient(): Minio.Client {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  });
}

const BUCKET = process.env.MINIO_BUCKET || "p2ptax";

async function ensureBucket(client: Minio.Client) {
  const exists = await client.bucketExists(BUCKET);
  if (!exists) {
    await client.makeBucket(BUCKET);
  }
}

function generateKey(folder: string, originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(8).toString("hex");
  return `${folder}/${Date.now()}-${hash}${ext}`;
}

// POST /api/upload/avatar — upload avatar image
router.post("/avatar", authMiddleware, avatarUpload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const client = getMinioClient();
    await ensureBucket(client);

    const key = generateKey("avatars", req.file.originalname);

    // TODO: resize to 400x400 with sharp
    await client.putObject(BUCKET, key, req.file.buffer, req.file.size, {
      "Content-Type": req.file.mimetype,
    });

    const url = `/${BUCKET}/${key}`;
    res.json({ url, key });
  } catch (error) {
    console.error("avatar upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// POST /api/upload/documents — upload document files (max 5)
router.post("/documents", authMiddleware, documentUpload.array("files", 5), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files provided" });
      return;
    }

    const client = getMinioClient();
    await ensureBucket(client);

    const results = [];
    for (const file of files) {
      const key = generateKey("documents", file.originalname);
      await client.putObject(BUCKET, key, file.buffer, file.size, {
        "Content-Type": file.mimetype,
      });
      results.push({
        url: `/${BUCKET}/${key}`,
        key,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
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
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only pdf, jpg, png allowed for chat files"));
    }
  },
});

router.post("/chat-file", authMiddleware, chatFileUpload.single("file"), async (req: Request, res: Response) => {
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

    if (!threadId || typeof threadId !== "string") {
      res.status(400).json({ error: "threadId is required" });
      return;
    }

    const client = getMinioClient();
    await ensureBucket(client);

    // Sanitize filename: replace unsafe chars, preserve extension
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `chat-files/${threadId}/${uploadToken}_${safeName}`;

    await client.putObject(BUCKET, key, req.file.buffer, req.file.size, {
      "Content-Type": req.file.mimetype,
    });

    res.json({
      uploadToken,
      fileUrl: `/${BUCKET}/${key}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error("chat-file upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// GET /api/upload/signed-url/:key — get signed URL
router.get("/signed-url/:key(*)", async (req: Request, res: Response) => {
  try {
    const client = getMinioClient();
    const rawKey = req.params.key;
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const url = await client.presignedGetObject(BUCKET, key, 60 * 60);
    res.json({ url });
  } catch (error) {
    console.error("get file error:", error);
    res.status(500).json({ error: "Failed to get file URL" });
  }
});

export default router;
