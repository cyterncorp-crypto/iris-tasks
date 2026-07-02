import { NextResponse } from "next/server";

const CACHE = new Map<string, string>();
const MAX_CHUNK = 480;

function isValidTranslation(original: string, translated: string | undefined): boolean {
  if (!translated?.trim()) return false;
  const lower = translated.toLowerCase();
  if (lower.includes("mymemory warning")) return false;
  if (lower.includes("query length limit")) return false;
  if (lower.includes("invalid source")) return false;
  return true;
}

async function translateWithMyMemory(text: string, target: "ru"): Promise<string | null> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text.slice(0, MAX_CHUNK));
  url.searchParams.set("langpair", `pt|${target}`);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };

  if (data.responseStatus === 429) return null;

  const translated = data.responseData?.translatedText?.trim();
  return isValidTranslation(text, translated) ? translated! : null;
}

async function translateWithLingva(text: string, target: "ru"): Promise<string | null> {
  const url = `https://lingva.ml/api/v1/pt/${target}/${encodeURIComponent(text.slice(0, 500))}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as { translation?: string };
  const translated = data.translation?.trim();
  return isValidTranslation(text, translated) ? translated! : null;
}

async function translateWithGoogle(text: string, target: "ru"): Promise<string | null> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=${target}&dt=t&q=${encodeURIComponent(text.slice(0, 2000))}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

  const translated = (data[0] as unknown[][])
    .map((part) => (typeof part[0] === "string" ? part[0] : ""))
    .join("")
    .trim();

  return isValidTranslation(text, translated) ? translated : null;
}

async function translateSegment(text: string, target: "ru"): Promise<string> {
  const key = `pt|${target}|${text}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const providers = [
    () => translateWithMyMemory(text, target),
    () => translateWithLingva(text, target),
    () => translateWithGoogle(text, target),
  ];

  for (const provider of providers) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const translated = await provider();
        if (translated) {
          CACHE.set(key, translated);
          return translated;
        }
      } catch {
        // try next
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return text;
}

async function translateOne(text: string, target: "ru"): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const fullKey = `pt|${target}|full|${trimmed}`;
  const cachedFull = CACHE.get(fullKey);
  if (cachedFull) return cachedFull;

  if (trimmed.length <= MAX_CHUNK) {
    const result = await translateSegment(trimmed, target);
    CACHE.set(fullKey, result);
    return result;
  }

  const paragraphs = trimmed.split(/\n\s*\n/);
  if (paragraphs.length > 1) {
    const translatedParagraphs: string[] = [];
    for (const para of paragraphs) {
      const p = para.trim();
      if (!p) {
        translatedParagraphs.push("");
        continue;
      }
      translatedParagraphs.push(await translateOne(p, target));
      await new Promise((r) => setTimeout(r, 80));
    }
    const result = translatedParagraphs.join("\n\n");
    CACHE.set(fullKey, result);
    return result;
  }

  const lines = trimmed.split("\n");
  const translatedLines: string[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      translatedLines.push(line);
      continue;
    }

    if (line.length <= MAX_CHUNK) {
      translatedLines.push(await translateSegment(line, target));
    } else {
      const parts: string[] = [];
      for (let i = 0; i < line.length; i += MAX_CHUNK) {
        parts.push(await translateSegment(line.slice(i, i + MAX_CHUNK), target));
        await new Promise((r) => setTimeout(r, 80));
      }
      translatedLines.push(parts.join(""));
    }
    await new Promise((r) => setTimeout(r, 80));
  }

  const result = translatedLines.join("\n");
  CACHE.set(fullKey, result);
  return result;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      texts?: string[];
      target?: string;
    };

    const texts = Array.isArray(body.texts) ? body.texts : [];
    const target = body.target === "ru" ? "ru" : "ru";

    if (texts.length === 0) {
      return NextResponse.json({ translations: [] });
    }

    const unique = [
      ...new Set(texts.filter((t) => typeof t === "string" && t.trim())),
    ].sort((a, b) => b.length - a.length);

    const map = new Map<string, string>();

    for (const text of unique) {
      map.set(text, await translateOne(text, target));
      await new Promise((r) => setTimeout(r, 60));
    }

    const translations = texts.map((t) => map.get(t) ?? t);
    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json({ error: "translation failed" }, { status: 500 });
  }
}
