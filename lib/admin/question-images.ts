import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const QUESTION_IMAGE_BUCKET = "exam-question-images";
export const QUESTION_IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
export const QUESTION_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/** Makes sure the public question-image bucket exists with the expected limits and returns an admin client. */
export async function ensureImageBucket() {
  const admin = createAdminClient();
  const settings = { public: true, allowedMimeTypes: Object.keys(QUESTION_IMAGE_TYPES), fileSizeLimit: QUESTION_IMAGE_MAX_BYTES };
  const { data } = await admin.storage.getBucket(QUESTION_IMAGE_BUCKET);
  if (data) {
    await admin.storage.updateBucket(QUESTION_IMAGE_BUCKET, settings);
    return admin;
  }
  const { error } = await admin.storage.createBucket(QUESTION_IMAGE_BUCKET, settings);
  if (error && !error.message.toLowerCase().includes("already")) throw new Error("Асуултын зургийн санг үүсгэж чадсангүй.");
  return admin;
}

/** Uploads question images (already validated) and returns their public URLs in the same order. */
export async function uploadQuestionImages(files: File[]) {
  const admin = await ensureImageBucket();
  const bucket = admin.storage.from(QUESTION_IMAGE_BUCKET);
  return Promise.all(files.map(async (file) => {
    const path = `uploads/${randomUUID()}.${QUESTION_IMAGE_TYPES[file.type]}`;
    const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`${file.name}: зургийг хадгалж чадсангүй.`);
    return bucket.getPublicUrl(path).data.publicUrl;
  }));
}
