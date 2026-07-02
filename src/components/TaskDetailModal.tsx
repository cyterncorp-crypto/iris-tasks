"use client";

import { useEffect, useRef, useState } from "react";
import type { ChecklistItem, Influencer, Task, TaskUpdate } from "@/lib/types";
import { getInfluencerName, getInfluencerPhoto } from "@/lib/types";
import {
  checklistProgress,
  deriveStatusFromChecklist,
  getTaskChecklist,
  parseChecklist,
} from "@/lib/checklist-utils";
import {
  downloadImage,
  getTaskImages,
  imageUrlsEqual,
} from "@/lib/task-images-utils";
import { deleteTaskImage, uploadTaskImage, validatePhotoFile } from "@/lib/upload-photo";
import {
  ALL_STATUSES,
  getDisplayStatus,
  getStatusLabel,
  normalizeStatus,
  statusSelectStyle,
} from "@/lib/task-utils";
import type { DisplayStatus } from "@/lib/types";
import { useT } from "@/lib/i18n/LocaleProvider";
import { expandTextsForTranslation } from "@/lib/translate-text";
import TranslatedText from "./TranslatedText";
import TaskChecklist from "./TaskChecklist";
import styles from "./TaskDetailModal.module.css";

interface Props {
  task: Task;
  influencers: Influencer[];
  onClose: () => void;
  onUpdate: (id: string, updates: TaskUpdate) => Promise<void>;
  onCopy: (task: Task, influencerIds: string[]) => Promise<void>;
}

function checklistsEqual(a: ChecklistItem[], b: ChecklistItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (item, i) =>
      item.id === b[i].id && item.text === b[i].text && item.done === b[i].done
  );
}

export default function TaskDetailModal({
  task,
  influencers,
  onClose,
  onUpdate,
  onCopy,
}: Props) {
  const { t, td, locale, translateTexts } = useT();
  const [title, setTitle] = useState(task.title);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => getTaskChecklist(task));
  const [images, setImages] = useState<string[]>(() => getTaskImages(task));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyTarget, setCopyTarget] = useState("");
  const [copyAll, setCopyAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const saveChecklistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const influencerName = getInfluencerName(task);
  const influencerPhoto = getInfluencerPhoto(task);

  const copyTargets = influencers.filter((inf) => inf.id !== task.influencer_id);

  useEffect(() => {
    if (locale !== "ru") return;
    const texts = [
      task.title,
      title,
      task.description ?? "",
      ...checklist.map((item) => item.text),
      ...copyTargets.map((inf) => inf.name),
    ].filter((s) => s?.trim()) as string[];
    if (texts.length > 0) void translateTexts(expandTextsForTranslation(texts), true);
  }, [locale, task.title, task.description, title, checklist, copyTargets, translateTexts]);

  useEffect(() => {
    if (locale === "pt") {
      setEditingTitle(false);
    }
  }, [locale]);

  useEffect(() => {
    setEditingTitle(false);
    setTitle(task.title);
    setChecklist(getTaskChecklist(task));
    setImages(getTaskImages(task));
  }, [task]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (saveChecklistTimer.current) clearTimeout(saveChecklistTimer.current);
    };
  }, []);

  const saveTitle = async () => {
    const v = title.trim();
    if (!v || v === task.title) return;
    setSaving(true);
    setError(null);
    try {
      await onUpdate(task.id, { title: v });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorSave"));
      setTitle(task.title);
    } finally {
      setSaving(false);
    }
  };

  const persistChecklist = async (items: ChecklistItem[]) => {
    const stored = parseChecklist(task.checklist);
    const baseline = stored.length > 0 ? stored : getTaskChecklist(task);
    if (checklistsEqual(items, baseline)) return;

    setSaving(true);
    setError(null);
    try {
      const progress = checklistProgress(items);
      const nextStatus = deriveStatusFromChecklist(items);
      await onUpdate(task.id, {
        checklist: items,
        description: null,
        progress,
        ...(nextStatus ? { status: nextStatus } : {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorSave"));
      setChecklist(getTaskChecklist(task));
    } finally {
      setSaving(false);
    }
  };

  const handleChecklistChange = (items: ChecklistItem[]) => {
    setChecklist(items);
    if (saveChecklistTimer.current) clearTimeout(saveChecklistTimer.current);
    saveChecklistTimer.current = setTimeout(() => {
      persistChecklist(items);
    }, 500);
  };

  const persistImages = async (urls: string[]) => {
    const current = getTaskImages(task);
    if (imageUrlsEqual(urls, current)) return;

    setSaving(true);
    setError(null);
    try {
      await onUpdate(task.id, {
        image_urls: urls,
        image_url: urls[0] ?? null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorSave"));
      setImages(getTaskImages(task));
    } finally {
      setSaving(false);
    }
  };

  const handleImages = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploading(true);
    setError(null);
    const newUrls: string[] = [];

    try {
      for (const file of list) {
        const err = validatePhotoFile(file);
        if (err) throw new Error(err);
        newUrls.push(await uploadTaskImage(file));
      }
      const next = [...images, ...newUrls];
      setImages(next);
      await persistImages(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorSave"));
      setImages(getTaskImages(task));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (url: string) => {
    setUploading(true);
    setError(null);
    try {
      await deleteTaskImage(url);
      const next = images.filter((u) => u !== url);
      setImages(next);
      await persistImages(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorSave"));
      setImages(getTaskImages(task));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      await downloadImage(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorSave"));
    }
  };

  const handleCopy = async () => {
    setCopySuccess(null);
    setError(null);

    let targetIds: string[] = [];
    if (copyAll) {
      targetIds = copyTargets.map((inf) => inf.id);
    } else if (copyTarget) {
      targetIds = [copyTarget];
    }

    if (targetIds.length === 0) {
      setError(t("selectCopyTarget"));
      return;
    }

    setCopying(true);
    try {
      await onCopy(task, targetIds);
      setCopySuccess(
        targetIds.length === 1
          ? t("taskCopied")
          : t("tasksCopied", { count: targetIds.length })
      );
      setCopyTarget("");
      setCopyAll(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorSave"));
    } finally {
      setCopying(false);
    }
  };

  const derivedStatus = deriveStatusFromChecklist(checklist);
  const displayStatus = derivedStatus ?? getDisplayStatus(task);
  const busy = saving || uploading || copying;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
      >
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")}>
          ×
        </button>

        <label className={styles.label} htmlFor="task-detail-title">
          {t("taskDetailTitle")}
        </label>
        {locale === "ru" && !editingTitle ? (
          <button
            type="button"
            id="task-detail-title"
            className={styles.titleRead}
            disabled={busy}
            onClick={() => setEditingTitle(true)}
            title={t("taskNameTitle")}
          >
            <TranslatedText text={title} />
          </button>
        ) : (
          <input
            ref={titleRef}
            id="task-detail-title"
            className={styles.titleInput}
            value={title}
            disabled={busy}
            autoFocus={editingTitle && locale === "ru"}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              saveTitle();
              setEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveTitle();
                setEditingTitle(false);
                (e.target as HTMLInputElement).blur();
              }
              if (e.key === "Escape") {
                e.stopPropagation();
                setTitle(task.title);
                setEditingTitle(false);
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder={t("taskDetailPlaceholder")}
          />
        )}

        <div className={styles.influencerRow}>
          {influencerPhoto ? (
            <img src={influencerPhoto} alt="" className={styles.influencerAvatar} />
          ) : (
            <span className={styles.influencerPlaceholder}>?</span>
          )}
          <span className={styles.influencerName}>
            {influencerName ? (
              <TranslatedText text={influencerName} />
            ) : (
              t("noInfluencer")
            )}
          </span>
        </div>

        <div className={styles.statusRow}>
          <label className={styles.statusLabel} htmlFor="task-status">
            {t("status")}
          </label>
          <select
            id="task-status"
            className={styles.statusSelect}
            value={displayStatus}
            disabled={busy}
            style={statusSelectStyle(displayStatus)}
            onChange={(e) =>
              onUpdate(task.id, {
                status: normalizeStatus(e.target.value) as DisplayStatus,
              })
            }
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getStatusLabel(s, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.divider} />

        <TaskChecklist
          items={checklist}
          onChange={handleChecklistChange}
          disabled={busy}
        />

        <label className={styles.label}>
          {t("taskImages")} {images.length > 0 && `(${images.length})`}
        </label>
        <div className={styles.imageSection}>
          {images.length > 0 && (
            <div className={styles.imageGrid}>
              {images.map((url) => (
                <div key={url} className={styles.imageCard}>
                  <img src={url} alt="" className={styles.taskImageThumb} />
                  <div className={styles.imageCardActions}>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      disabled={busy}
                      onClick={() => handleDownload(url)}
                    >
                      {t("download")}
                    </button>
                    <button
                      type="button"
                      className={`${styles.smallBtn} ${styles.smallBtnDanger}`}
                      disabled={busy}
                      onClick={() => removeImage(url)}
                    >
                      {t("remove")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className={styles.uploadZone}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <span className={styles.uploadIcon}>+</span>
            <span>
              {uploading
                ? t("uploading")
                : images.length > 0
                  ? t("addMoreImages")
                  : t("addImages")}
            </span>
          </button>

          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            className={styles.hidden}
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) handleImages(files);
              e.target.value = "";
            }}
          />
        </div>

        {copyTargets.length > 0 && (
          <>
            <div className={styles.divider} />
            <label className={styles.label}>{t("copyTask")}</label>
            <p className={styles.copyHint}>{t("copyTaskHint")}</p>
            <div className={styles.copySection}>
              <select
                className={styles.copySelect}
                value={copyTarget}
                disabled={busy || copyAll}
                onChange={(e) => setCopyTarget(e.target.value)}
              >
                <option value="">{t("chooseInfluencer")}</option>
                {copyTargets.map((inf) => (
                  <option key={inf.id} value={inf.id}>
                    {td(inf.name)}
                  </option>
                ))}
              </select>

              {copyTargets.length > 1 && (
                <label className={styles.copyAllLabel}>
                  <input
                    type="checkbox"
                    checked={copyAll}
                    disabled={busy}
                    onChange={(e) => {
                      setCopyAll(e.target.checked);
                      if (e.target.checked) setCopyTarget("");
                    }}
                  />
                  {t("copyAllOthers", { count: copyTargets.length })}
                </label>
              )}

              <button
                type="button"
                className={styles.copyBtn}
                disabled={busy || (!copyAll && !copyTarget)}
                onClick={handleCopy}
              >
                {copying ? t("copying") : t("copyTaskBtn")}
              </button>
            </div>
          </>
        )}

        {copySuccess && <p className={styles.success}>{copySuccess}</p>}
        {(saving || uploading) && <p className={styles.statusHint}>{t("saving")}</p>}
        {error && (
          <p className={styles.error}>
            {error.includes("checklist") ||
            error.includes("image_urls") ||
            error.includes("column") ||
            error.includes("enum") ||
            error.includes("nao realizado")
              ? t("dbOutdated")
              : error}
          </p>
        )}
      </div>
    </div>
  );
}
