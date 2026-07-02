import type { ChecklistItem, Task, TaskStatus } from "./types";

function isChecklistItem(value: unknown): value is ChecklistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    typeof item.done === "boolean"
  );
}

export function parseChecklist(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isChecklistItem).map((item) => ({
    id: item.id,
    text: item.text,
    done: item.done,
  }));
}

export function getTaskChecklist(task: Task): ChecklistItem[] {
  const fromColumn = parseChecklist(task.checklist);
  if (fromColumn.length > 0) return fromColumn;

  const legacy = task.description?.trim();
  if (legacy) {
    return [{ id: crypto.randomUUID(), text: legacy, done: false }];
  }

  return [];
}

export function createChecklistItem(text = ""): ChecklistItem {
  return { id: crypto.randomUUID(), text, done: false };
}

export function checklistProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}

export function deriveStatusFromChecklist(items: ChecklistItem[]): TaskStatus | null {
  if (items.length === 0) return null;
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return "feito";
  return "em andamento";
}

export function checklistMatchesSearch(items: ChecklistItem[], query: string): boolean {
  const q = query.toLowerCase();
  return items.some((item) => item.text.toLowerCase().includes(q));
}
