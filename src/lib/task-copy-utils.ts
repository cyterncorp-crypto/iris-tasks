import type { ChecklistItem, Task } from "./types";
import { getTaskChecklist } from "./checklist-utils";
import { getTaskImages } from "./task-images-utils";
import { getTaskTags, normalizeTaskTags } from "./tag-utils";
import { normalizeStatus } from "./task-utils";

export function buildTaskCopyPayload(
  source: Task,
  influencerId: string,
  images: string[] = getTaskImages(source)
) {
  const checklist: ChecklistItem[] = getTaskChecklist(source).map((item) => ({
    ...item,
    id: crypto.randomUUID(),
  }));

  return {
    title: source.title,
    influencer_id: influencerId,
    status: normalizeStatus(source.status),
    tags: normalizeTaskTags(
      getTaskTags(source).map((tag) => ({
        ...tag,
        id: crypto.randomUUID(),
      }))
    ),
    tag: null,
    tag_color: null,
    progress: source.progress,
    due_date: source.due_date,
    checklist,
    image_urls: images,
    image_url: images[0] ?? null,
    description: null,
  };
}
