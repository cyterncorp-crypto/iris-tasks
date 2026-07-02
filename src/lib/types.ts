export type TaskStatus = "em andamento" | "feito" | "nao realizado";
/** @deprecated valor legado no banco — tratado como "em andamento" na UI */
export type TaskStatusLegacy = TaskStatus | "pendente";
/** @deprecated legado no banco — use tag/tag_color */
export type TaskPriority = "baixa" | "media" | "alta";
export type DisplayStatus = TaskStatus;

export interface TaskTag {
  id: string;
  label: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Influencer {
  id: string;
  name: string;
  slug?: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  checklist?: ChecklistItem[] | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  influencer_id: string | null;
  influencer?: Influencer | null;
  due_date: string | null;
  status: TaskStatus | "pendente";
  /** @deprecated use tag */
  priority?: TaskPriority;
  /** @deprecated use tags */
  tag?: string | null;
  /** @deprecated use tags */
  tag_color?: string | null;
  tags?: TaskTag[] | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export type TaskUpdate = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "checklist"
    | "image_url"
    | "image_urls"
    | "influencer_id"
    | "due_date"
    | "status"
    | "tag"
    | "tag_color"
    | "tags"
    | "progress"
  >
>;

export type InfluencerUpdate = Partial<Pick<Influencer, "name" | "photo_url">>;

export function getTaskInfluencer(task: Task): Influencer | null {
  return task.influencer ?? null;
}

export function getInfluencerName(task: Task): string | null {
  return getTaskInfluencer(task)?.name ?? null;
}

export function getInfluencerPhoto(task: Task): string | null {
  return getTaskInfluencer(task)?.photo_url ?? null;
}
