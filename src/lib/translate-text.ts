import type { Locale } from "./i18n/messages";

export function splitTranslatableLines(text: string): string[] {
  if (!text?.trim()) return [];
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.length > 0 ? lines : [text.trim()];
}

export function getTranslatedDisplay(
  text: string,
  locale: Locale,
  td: (value: string) => string
): string {
  if (locale === "pt" || !text?.trim()) return text;

  const trimmed = text.trim();
  const full = td(trimmed);
  if (full !== trimmed) return full;

  return translateMultilineText(text, locale, td);
}

export function translateMultilineText(
  text: string,
  locale: Locale,
  td: (value: string) => string
): string {
  if (locale === "pt" || !text) return text;

  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      const translated = td(trimmed);
      if (translated !== trimmed) return translated;
      const indent = line.match(/^(\s*)/)?.[1] ?? "";
      return indent + translated;
    })
    .join("\n");
}

export function expandTextsForTranslation(texts: string[]): string[] {
  const expanded = new Set<string>();

  for (const text of texts) {
    const trimmed = text?.trim();
    if (!trimmed) continue;

    expanded.add(trimmed);

    if (trimmed.includes("\n")) {
      for (const line of splitTranslatableLines(trimmed)) {
        expanded.add(line);
      }

      const paragraphs = trimmed.split(/\n\s*\n/);
      if (paragraphs.length > 1) {
        for (const para of paragraphs) {
          const p = para.trim();
          if (p) expanded.add(p);
        }
      }
    } else if (trimmed.length > 200) {
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      if (sentences.length > 1) {
        for (const sentence of sentences) {
          const s = sentence.trim();
          if (s) expanded.add(s);
        }
      }
    }
  }

  return [...expanded].sort((a, b) => b.length - a.length);
}
