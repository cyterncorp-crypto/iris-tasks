import type { Task, TaskTag } from "./types";

export const MAX_TASK_TAGS = 4;

export const TAG_COLOR_PRESETS = [
  "#7c3aed",
  "#5b5bd6",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#64748b",
] as const;

export const DEFAULT_TAG_COLOR = TAG_COLOR_PRESETS[0];

const LEGACY_PRIORITY_TAGS: Record<string, TaskTag> = {
  baixa: { id: "legacy-baixa", label: "Baixa", color: "#64748b" },
  media: { id: "legacy-media", label: "Média", color: "#5b5bd6" },
  alta: { id: "legacy-alta", label: "Alta", color: "#7c3aed" },
};

function isTaskTag(value: unknown): value is TaskTag {
  if (!value || typeof value !== "object") return false;
  const t = value as TaskTag;
  return (
    typeof t.id === "string" &&
    typeof t.label === "string" &&
    typeof t.color === "string"
  );
}

export function normalizeTaskTags(tags: TaskTag[]): TaskTag[] {
  return tags
    .map((tag) => ({
      id: tag.id || crypto.randomUUID(),
      label: tag.label.trim(),
      color: tag.color?.trim() || DEFAULT_TAG_COLOR,
    }))
    .filter((tag) => tag.label.length > 0)
    .slice(0, MAX_TASK_TAGS);
}

export function getTaskTags(task: Task): TaskTag[] {
  if (Array.isArray(task.tags) && task.tags.length > 0) {
    return normalizeTaskTags(task.tags.filter(isTaskTag));
  }

  if (task.tag?.trim()) {
    return normalizeTaskTags([
      {
        id: "legacy-tag",
        label: task.tag.trim(),
        color: task.tag_color?.trim() || DEFAULT_TAG_COLOR,
      },
    ]);
  }

  if (task.priority && LEGACY_PRIORITY_TAGS[task.priority]) {
    return [LEGACY_PRIORITY_TAGS[task.priority]];
  }

  return [];
}

export function tagTextColor(bgHex: string): string {
  const hex = bgHex.replace("#", "");
  if (hex.length !== 6) return "#ffffff";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#1e293b" : "#ffffff";
}

export function createEmptyTag(): TaskTag {
  return {
    id: crypto.randomUUID(),
    label: "",
    color: DEFAULT_TAG_COLOR,
  };
}
