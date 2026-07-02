import type { ReactNode } from "react";

export function parseBoldSegments(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}-b-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export type ChecklistLineKind = "h1" | "h2" | "h3" | "p" | "blank";

export interface ChecklistLine {
  kind: ChecklistLineKind;
  content: string;
}

export function parseChecklistLines(text: string): ChecklistLine[] {
  return text.split("\n").map((line) => {
    if (!line.trim()) return { kind: "blank", content: "" };
    if (line.startsWith("### ")) return { kind: "h3", content: line.slice(4) };
    if (line.startsWith("## ")) return { kind: "h2", content: line.slice(3) };
    if (line.startsWith("# ")) return { kind: "h1", content: line.slice(2) };
    return { kind: "p", content: line };
  });
}

export function hasChecklistFormatting(text: string): boolean {
  return /(\*\*[^*]+\*\*|^# |^## |^### )/m.test(text);
}
