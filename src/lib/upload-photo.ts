import { supabase } from "./supabase";

const INFLUENCER_BUCKET = "influencer-photos";
const TASK_BUCKET = "task-images";
const MAX_SIZE_MB = 5;
const MAX_PX = 800;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function resolveMimeType(file: File): string {
  if (file.type && ALLOWED_TYPES.includes(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "";
}

export function validatePhotoFile(file: File): string | null {
  const mime = resolveMimeType(file);
  if (!mime) return "Use JPG, PNG, WebP ou GIF.";
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `A imagem deve ter no máximo ${MAX_SIZE_MB}MB.`;
  }
  return null;
}

async function resizeImage(file: File): Promise<{ blob: Blob; mime: string }> {
  const mime = resolveMimeType(file);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_PX / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const outputMime = mime === "image/png" || mime === "image/gif" ? mime : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao comprimir imagem"))),
      outputMime,
      0.9
    );
  });
  return { blob, mime: outputMime };
}

async function uploadToStorage(
  blob: Blob,
  mime: string,
  bucket: string
): Promise<string> {
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    cacheControl: "3600",
    upsert: false,
    contentType: mime,
  });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      throw new Error(
        `Bucket "${bucket}" não encontrado. Execute a migração SQL no Supabase.`
      );
    }
    if (error.message.includes("row-level security") || error.message.includes("policy")) {
      throw new Error(
        `Permissão negada no bucket "${bucket}". Execute supabase/migration-fix-task-images-policies.sql no Supabase.`
      );
    }
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadImageToBucket(file: File, bucket: string): Promise<string> {
  const validation = validatePhotoFile(file);
  if (validation) throw new Error(validation);
  const { blob, mime } = await resizeImage(file);
  return uploadToStorage(blob, mime, bucket);
}

export async function uploadInfluencerPhoto(file: File): Promise<string> {
  return uploadImageToBucket(file, INFLUENCER_BUCKET);
}

export async function uploadTaskImage(file: File): Promise<string> {
  return uploadImageToBucket(file, TASK_BUCKET);
}

export function isStoragePhotoUrl(url: string | null, bucket = INFLUENCER_BUCKET): boolean {
  if (!url || url.startsWith("data:")) return false;
  return url.includes(`/storage/v1/object/public/${bucket}/`);
}

export async function deleteStorageImage(
  url: string,
  bucket = INFLUENCER_BUCKET
): Promise<void> {
  if (!isStoragePhotoUrl(url, bucket)) return;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const path = url.split(marker)[1];
  if (!path) return;

  await supabase.storage.from(bucket).remove([decodeURIComponent(path)]);
}

export async function deleteInfluencerPhoto(url: string): Promise<void> {
  return deleteStorageImage(url, INFLUENCER_BUCKET);
}

export async function deleteTaskImage(url: string): Promise<void> {
  return deleteStorageImage(url, TASK_BUCKET);
}

export async function deleteTaskImageIfUnused(
  url: string,
  currentTaskId: string
): Promise<void> {
  if (!isStoragePhotoUrl(url, TASK_BUCKET)) return;

  const { data, error } = await supabase
    .from("tasks")
    .select("id,image_url,image_urls");

  if (error) throw error;

  const stillUsed = (data ?? []).some((task) => {
    if (task.id === currentTaskId) return false;
    if (task.image_url === url) return true;
    return Array.isArray(task.image_urls) && task.image_urls.includes(url);
  });

  if (!stillUsed) {
    await deleteTaskImage(url);
  }
}

export async function checkStorageAvailable(bucket = INFLUENCER_BUCKET): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).list("", { limit: 1 });
  return !error;
}

export function getStoragePublicUrl(path: string, bucket = INFLUENCER_BUCKET): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
