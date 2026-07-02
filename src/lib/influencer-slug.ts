import type { Influencer } from "./types";

export function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0400-\u04FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getInfluencerSlug(influencer: Pick<Influencer, "slug" | "name" | "id">): string {
  if (influencer.slug?.trim()) return influencer.slug.trim();
  const fromName = slugifyName(influencer.name);
  return fromName || influencer.id;
}

export function getInfluencerProfilePath(
  influencer: Pick<Influencer, "slug" | "name" | "id">
): string {
  return `/influenciadores/${getInfluencerSlug(influencer)}`;
}

export async function buildUniqueSlug(
  name: string,
  existingSlugs: string[],
  currentSlug?: string | null
): Promise<string> {
  const base = slugifyName(name) || "influenciador";
  const taken = new Set(
    existingSlugs.filter((s) => s && s !== (currentSlug ?? ""))
  );

  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
