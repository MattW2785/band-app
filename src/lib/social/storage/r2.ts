import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID o R2_SECRET_ACCESS_KEY non impostate");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME non impostata");
  return bucket;
}

export function buildStoragePath(originalName: string): string {
  const extension = originalName.includes(".") ? originalName.split(".").pop() : undefined;
  return `${randomUUID()}${extension ? `.${extension}` : ""}`;
}

// URL firmato per upload diretto dal browser: bypassa del tutto il nostro server (niente
// limiti di payload di Vercel, niente tetto per-file come sul piano gratuito di Supabase).
export async function createSignedUploadUrl(storagePath: string, contentType: string): Promise<string> {
  const client = getClient();
  const command = new PutObjectCommand({ Bucket: getBucket(), Key: storagePath, ContentType: contentType });
  return getSignedUrl(client, command, { expiresIn: 600 });
}

export function getPublicUrl(storagePath: string): string {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) throw new Error("R2_PUBLIC_URL non impostata");
  return `${base.replace(/\/$/, "")}/${storagePath}`;
}

export async function deleteMediaFile(storagePath: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: storagePath }));
}
