import type { Task } from "./types";
import { getTaskTags } from "./tag-utils";
import { expandTextsForTranslation } from "./translate-text";

export function collectTranslatableTexts(tasks: Task[]): string[] {
  const texts: string[] = [];

  for (const task of tasks) {
    if (task.title?.trim()) texts.push(task.title);

    for (const tag of getTaskTags(task)) {
      if (tag.label?.trim()) texts.push(tag.label);
    }
  }

  return expandTextsForTranslation(texts);
}
