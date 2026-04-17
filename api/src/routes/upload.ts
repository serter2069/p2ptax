import { Router, Request, Response } from "express";
import multer from "multer";
import * as Minio from "minio";
import crypto from "crypto";
import path from "path";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

function getMinioClient(): Minio.Client {
  return new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  });
}

const BUCKET = process.env.MINIO_BUCKET || "uploads";

// POST /api/upload — upload a file
router.post("/", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const client = getMinioClient();

    // Ensure bucket exists
    const exists = await client.bucketExists(BUCKET);
    if (!exists) {
      await client.makeBucket(BUCKET);
    }

    const ext = path.extname(req.file.originalname);
    const key = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

    await client.putObject(BUCKET, key, req.file.buffer, req.file.size, {
      "Content-Type": req.file.mimetype,
    });

    res.json({
      key,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error("upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// GET /api/files/:key — get signed URL for a file
router.get("/files/:key", async (req: Request, res: Response) => {
  try {
    const client = getMinioClient();
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const url = await client.presignedGetObject(BUCKET, key, 60 * 60); // 1 hour
    res.json({ url });
  } catch (error) {
    console.error("get file error:", error);
    res.status(500).json({ error: "Failed to get file URL" });
  }
});

export default router;
