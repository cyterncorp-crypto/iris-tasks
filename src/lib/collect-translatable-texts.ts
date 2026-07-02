import type { Influencer, Task } from "./types";
import { getTaskChecklist } from "./checklist-utils";
import { getTaskTags } from "./tag-utils";
import { expandTextsForTranslation } from "./translate-text";

export function collectTranslatableTexts(
  tasks: Task[],
  influencers: Influencer[] = []
): string[] {
  const texts: string[] = [];

  for (const task of tasks) {
    if (task.title?.trim()) texts.push(task.title);

    if (task.description?.trim()) texts.push(task.description);

    for (const item of getTaskChecklist(task)) {
      if (item.text?.trim()) texts.push(item.text);
    }

    for (const tag of getTaskTags(task)) {
      if (tag.label?.trim()) texts.push(tag.label);
    }
  }

  for (const inf of influencers) {
    if (inf.name?.trim()) texts.push(inf.name);
  }

  return expandTextsForTranslation(texts);
}
