import { Injectable, Logger } from '@nestjs/common';
import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;
  private bucket: string;
  private endpoint: string;

  constructor() {
    const endpoint = process.env.HETZNER_S3_ENDPOINT;
    const bucket = process.env.HETZNER_S3_BUCKET;
    const accessKey = process.env.HETZNER_S3_ACCESS_KEY;
    const secretKey = process.env.HETZNER_S3_SECRET_KEY;

    this.bucket = bucket || 'p2ptax';
    this.endpoint = endpoint || '';

    if (endpoint && accessKey && secretKey) {
      this.s3 = new S3Client({
        endpoint,
        region: 'us-east-1',
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
        forcePathStyle: true,
      });
      this.logger.log(`S3 storage enabled: ${endpoint}/${this.bucket}`);
    } else {
      this.logger.warn('S3 env vars not set — using local disk storage fallback');
    }
  }

  get isS3Enabled(): boolean {
    return !!this.s3;
  }

  async uploadBuffer(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    if (!this.s3) throw new Error('S3 not configured');
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'public-read',
      }),
    );
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.s3) return;
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      // Log but don't throw — file may already be gone
      this.logger.warn(`Failed to delete S3 object ${key}: ${err}`);
    }
  }

  /**
   * Extract the S3 key from a full public URL returned by uploadBuffer.
   * e.g. https://s3.smartlaunchhub.com/p2ptax/avatars/abc.jpg -> avatars/abc.jpg
   */
  extractKey(publicUrl: string): string {
    const prefix = `${this.endpoint}/${this.bucket}/`;
    return publicUrl.startsWith(prefix) ? publicUrl.slice(prefix.length) : publicUrl;
  }
}
