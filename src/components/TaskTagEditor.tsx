"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_TAG_COLOR,
  MAX_TASK_TAGS,
  TAG_COLOR_PRESETS,
  createEmptyTag,
  getTaskTags,
  normalizeTaskTags,
  tagTextColor,
} from "@/lib/tag-utils";
import type { Task, TaskTag, TaskUpdate } from "@/lib/types";
import { useT } from "@/lib/i18n/LocaleProvider";
import TranslatedText from "./TranslatedText";
import styles from "./TaskTagEditor.module.css";

interface Props {
  task: Task;
  onUpdate: (id: string, updates: TaskUpdate) => void;
}

function ColorPicker({
  color,
  onChange,
  customColorLabel,
}: {
  color: string;
  onChange: (color: string) => void;
  customColorLabel: string;
}) {
  return (
    <div className={styles.colorRow}>
      {TAG_COLOR_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className={`${styles.colorSwatch} ${color === preset ? styles.colorSwatchActive : ""}`}
          style={{ background: preset }}
          onClick={() => onChange(preset)}
          title={preset}
        />
      ))}
      <label className={styles.customColor} title={customColorLabel}>
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

export default function TaskTagEditor({ task, onUpdate }: Props) {
  const { t, locale, translateTexts } = useT();
  const savedTags = getTaskTags(task);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TaskTag[]>(savedTags);
  const wrapRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (!open) {
      setDraft(getTaskTags(task));
    }
  }, [task.tags, task.tag, task.tag_color, task.priority, open]);

  useEffect(() => {
    if (locale !== "ru") return;
    const labels = savedTags.map((tag) => tag.label).filter((s) => s?.trim());
    if (labels.length > 0) void translateTexts(labels, true);
  }, [locale, savedTags, translateTexts]);

  const save = useCallback(() => {
    const next = normalizeTaskTags(draftRef.current);
    const current = getTaskTags(task);
    const changed =
      next.length !== current.length ||
      next.some(
        (tag, i) =>
          tag.label !== current[i]?.label || tag.color !== current[i]?.color
      );

    if (!changed) return;

    onUpdate(task.id, {
      tags: next,
      tag: null,
      tag_color: null,
    });
  }, [onUpdate, task]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        save();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, save]);

  const openEditor = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = getTaskTags(task);
    setDraft(current.length > 0 ? current : [createEmptyTag()]);
    setOpen(true);
  };

  const updateTag = (id: string, patch: Partial<TaskTag>) => {
    setDraft((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, ...patch } : tag))
    );
  };

  const removeTag = (id: string) => {
    setDraft((prev) => prev.filter((tag) => tag.id !== id));
  };

  const addTag = () => {
    if (draft.length >= MAX_TASK_TAGS) return;
    setDraft((prev) => [...prev, createEmptyTag()]);
  };

  if (!open) {
    return (
      <div className={styles.tagList} onClick={openEditor}>
        {savedTags.map((tag) => (
          <span
            key={tag.id}
            className={styles.tagPill}
            style={{
              background: tag.color,
              color: tagTextColor(tag.color),
            }}
            title={tag.label}
          >
            <TranslatedText text={tag.label} />
          </span>
        ))}
        {savedTags.length < MAX_TASK_TAGS && (
          <button type="button" className={styles.addBtn} title={t("addTag")}>
            {t("addTag")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={styles.editor}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles.editorHeader}>
        <span className={styles.editorTitle}>{t("tagName")}</span>
        <span className={styles.editorCount}>
          {draft.filter((tag) => tag.label.trim()).length}/{MAX_TASK_TAGS}
        </span>
      </div>

      {draft.map((tag, index) => (
        <div key={tag.id} className={styles.tagRow}>
          <div className={styles.tagRowTop}>
            <input
              className={styles.textInput}
              value={tag.label}
              onChange={(e) => updateTag(tag.id, { label: e.target.value })}
              placeholder={t("tagPlaceholder")}
              maxLength={24}
              autoFocus={index === draft.length - 1 && !tag.label}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  save();
                  setOpen(false);
                }
                if (e.key === "Escape") {
                  setDraft(getTaskTags(task));
                  setOpen(false);
                }
              }}
            />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => removeTag(tag.id)}
              title={t("remove")}
            >
              ×
            </button>
          </div>
          <ColorPicker
            color={tag.color || DEFAULT_TAG_COLOR}
            onChange={(color) => updateTag(tag.id, { color })}
            customColorLabel={t("customColor")}
          />
          {tag.label.trim() && (
            <span
              className={styles.tagPreview}
              style={{
                background: tag.color || DEFAULT_TAG_COLOR,
                color: tagTextColor(tag.color || DEFAULT_TAG_COLOR),
              }}
            >
              <TranslatedText text={tag.label.trim()} />
            </span>
          )}
        </div>
      ))}

      {draft.length < MAX_TASK_TAGS && (
        <button type="button" className={styles.addRowBtn} onClick={addTag}>
          {t("addTagRow")}
        </button>
      )}
    </div>
  );
}
