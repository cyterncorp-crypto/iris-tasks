import type { Task } from "./types";

export function parseImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((u): u is string => typeof u === "string" && u.length > 0);
}

export function getTaskImages(task: Task): string[] {
  const fromColumn = parseImageUrls(task.image_urls);
  if (fromColumn.length > 0) return fromColumn;
  if (task.image_url?.trim()) return [task.image_url];
  return [];
}

export function imageUrlsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((url, i) => url === b[i]);
}

export async function downloadImage(url: string): Promise<void> {
  const filename = decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "imagem.jpg");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Falha ao baixar a imagem");
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}
