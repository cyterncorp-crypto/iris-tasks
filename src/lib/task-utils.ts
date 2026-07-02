import type { Locale } from "./i18n/messages";
import { localeMonths, localeWeekdays, messages } from "./i18n/messages";
import type { DisplayStatus, Task, TaskStatus } from "./types";

function isOverdue(dueDate: string): boolean {
  const due = new Date(dueDate + "T23:59:59");
  return due < new Date();
}

export function normalizeStatus(status: string): TaskStatus {
  if (status === "feito") return "feito";
  if (status === "nao realizado") return "nao realizado";
  return "em andamento";
}

export function getDisplayStatus(task: Task): DisplayStatus {
  if (task.status === "feito") return "feito";
  if (task.status === "nao realizado") return "nao realizado";
  if (task.due_date && isOverdue(task.due_date)) return "nao realizado";
  return normalizeStatus(task.status);
}

export const STATUS_ORDER: DisplayStatus[] = [
  "nao realizado",
  "em andamento",
  "feito",
];

export const STATUS_LABELS: Record<DisplayStatus, string> = {
  "nao realizado": "NÃO REALIZADO",
  "em andamento": "EM ANDAMENTO",
  feito: "FEITO",
};

export const STATUS_COLORS: Record<DisplayStatus, string> = {
  "nao realizado": "#ef4444",
  "em andamento": "#eab308",
  feito: "#22c55e",
};

export const STATUS_TEXT_COLORS: Record<DisplayStatus, string> = {
  "nao realizado": "#b91c1c",
  "em andamento": "#854d0e",
  feito: "#15803d",
};

export const ALL_STATUSES: DisplayStatus[] = [
  "nao realizado",
  "em andamento",
  "feito",
];

/** @deprecated use ALL_STATUSES */
export const DB_STATUSES = ALL_STATUSES;

export function statusSelectStyle(status: DisplayStatus): {
  background: string;
  color: string;
  border?: string;
} {
  if (status === "em andamento") {
    return {
      background: "#fef9c3",
      color: STATUS_TEXT_COLORS["em andamento"],
      border: "1px solid #fde047",
    };
  }
  if (status === "nao realizado") {
    return {
      background: "#fee2e2",
      color: STATUS_TEXT_COLORS["nao realizado"],
      border: "1px solid #fecaca",
    };
  }
  return {
    background: `${STATUS_COLORS[status]}20`,
    color: STATUS_COLORS[status],
  };
}

export function getStatusLabel(status: DisplayStatus, locale: Locale = "pt"): string {
  const map: Record<DisplayStatus, keyof typeof messages.pt> = {
    "nao realizado": "statusNotDone",
    "em andamento": "statusInProgress",
    feito: "statusDone",
  };
  return messages[locale][map[status]];
}

export function formatDate(dateStr: string | null, locale: Locale = "pt"): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const months = localeMonths[locale];
  const of = locale === "ru" ? "" : " de ";
  return locale === "ru"
    ? `${day} ${months[month - 1]}`
    : `${day}${of}${months[month - 1]}`;
}

export function getTodayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function collectTaskDateKeys(tasks: Task[]): string[] {
  const days = new Set<string>();
  for (const t of tasks) {
    if (t.due_date) days.add(t.due_date);
  }
  return [...days].sort();
}

export function formatFilterDayLabel(dateStr: string, locale: Locale = "pt"): string {
  const today = getTodayDateKey();
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = localeWeekdays[locale];
  const weekday = weekdays[date.getDay()];
  const short = formatDate(dateStr, locale);
  if (dateStr === today) return `${messages[locale].today} · ${short}`;
  return `${weekday}, ${short}`;
}

export type DateFilterValue = "principal" | "geral" | (string & {});

export function isAllTasksFilter(value: DateFilterValue): boolean {
  return value === "principal" || value === "geral";
}

export const NO_DUE_DATE_KEY = "__sem_data__";

export function groupTasksByDueDate(tasks: Task[]): { key: string; tasks: Task[] }[] {
  const map = new Map<string, Task[]>();

  for (const task of tasks) {
    const key = task.due_date ?? NO_DUE_DATE_KEY;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }

  const sortTasks = (list: Task[]) =>
    [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const keys = [...map.keys()].sort((a, b) => {
    if (a === NO_DUE_DATE_KEY) return 1;
    if (b === NO_DUE_DATE_KEY) return -1;
    return a.localeCompare(b);
  });

  return keys.map((key) => ({ key, tasks: sortTasks(map.get(key)!) }));
}

export function formatDueDateGroupLabel(dateKey: string, locale: Locale = "pt"): string {
  if (dateKey === NO_DUE_DATE_KEY) return messages[locale].noDueDate;
  return formatFilterDayLabel(dateKey, locale).toUpperCase();
}

export function dueDateGroupColor(dateKey: string): string {
  if (dateKey === NO_DUE_DATE_KEY) return "#94a3b8";
  const today = getTodayDateKey();
  if (dateKey < today) return "#ef4444";
  if (dateKey === today) return "#eab308";
  return "#5b5bd6";
}

export function toInputDate(dateStr: string | null): string {
  return dateStr ?? "";
}

export function getInfluencerOverallProgress(tasks: Task[]): {
  done: number;
  total: number;
  percent: number;
} {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "feito").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}
