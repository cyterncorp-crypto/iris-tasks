"use client";

import { useState, useRef, useEffect } from "react";
import type { Influencer, Task, TaskStatus, TaskUpdate } from "@/lib/types";
import { getInfluencerPhoto } from "@/lib/types";
import {
  getDisplayStatus,
  normalizeStatus,
  formatDate,
  getStatusLabel,
  STATUS_COLORS,
  ALL_STATUSES,
  statusSelectStyle,
} from "@/lib/task-utils";
import { useT } from "@/lib/i18n/LocaleProvider";
import TranslatedText from "./TranslatedText";
import TaskTagEditor from "./TaskTagEditor";
import styles from "./TaskRow.module.css";

interface Props {
  task: Task;
  influencers: Influencer[];
  hideInfluencerColumns?: boolean;
  onUpdate: (id: string, updates: TaskUpdate) => void;
  onOpen: () => void;
  onDelete: (id: string) => void;
}

export default function TaskRow({
  task,
  influencers,
  hideInfluencerColumns = false,
  onUpdate,
  onOpen,
  onDelete,
}: Props) {
  const { t, td, locale } = useT();
  const [editingDate, setEditingDate] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const dateRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const display = getDisplayStatus(task);
  const photoUrl = getInfluencerPhoto(task);
  const currentStatus = getDisplayStatus(task);

  const statusStyle = statusSelectStyle;

  useEffect(() => {
    setTitleDraft(task.title);
  }, [task.title]);

  useEffect(() => {
    if (locale === "pt") {
      setEditingTitle(false);
    }
  }, [locale]);

  useEffect(() => {
    if (editingDate) {
      dateRef.current?.showPicker?.();
      dateRef.current?.focus();
    }
  }, [editingDate]);

  useEffect(() => {
    if (editingTitle) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [editingTitle]);

  const saveTitle = () => {
    const v = titleDraft.trim();
    setEditingTitle(false);
    if (!v || v === task.title) {
      setTitleDraft(task.title);
      return;
    }
    onUpdate(task.id, { title: v });
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <tr className={styles.row} onClick={onOpen}>
      <td className={styles.cell}>
        <div className={styles.nameCell}>
          <span
            className={styles.statusDot}
            style={{ background: STATUS_COLORS[display] }}
          />
          {editingTitle ? (
            <input
              ref={titleRef}
              className={styles.titleInput}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitleDraft(task.title);
                  setEditingTitle(false);
                }
              }}
              onClick={stop}
              placeholder={t("taskNamePlaceholder")}
            />
          ) : (
            <span
              className={styles.taskName}
              title={t("taskNameTitle")}
              onDoubleClick={(e) => {
                stop(e);
                setEditingTitle(true);
              }}
            >
              <TranslatedText text={task.title} />
            </span>
          )}
        </div>
      </td>

      {!hideInfluencerColumns && (
        <>
          <td className={styles.cell} onClick={stop}>
            <div className={styles.avatarWrap}>
              {photoUrl ? (
                <img src={photoUrl} alt="" className={styles.avatar} />
              ) : (
                <span className={styles.avatarPlaceholder}>?</span>
              )}
            </div>
          </td>

          <td className={styles.cell} onClick={stop}>
            <select
              className={styles.influencerSelect}
              value={task.influencer_id ?? ""}
              onChange={(e) => {
                const v = e.target.value || null;
                onUpdate(task.id, { influencer_id: v });
              }}
            >
              <option value="">{t("none")}</option>
              {influencers.map((inf) => (
                <option key={inf.id} value={inf.id}>
                  {td(inf.name)}
                </option>
              ))}
            </select>
          </td>
        </>
      )}

      <td className={styles.cell} onClick={stop}>
        {editingDate ? (
          <input
            ref={dateRef}
            type="date"
            className={styles.dateInput}
            defaultValue={task.due_date ?? ""}
            onBlur={() => setEditingDate(false)}
            onChange={(e) => {
              const v = e.target.value || null;
              onUpdate(task.id, { due_date: v });
              setEditingDate(false);
            }}
          />
        ) : (
          <button
            type="button"
            className={styles.dateBtn}
            onClick={() => setEditingDate(true)}
          >
            {task.due_date ? (
              <span className={styles.dateText}>{formatDate(task.due_date, locale)}</span>
            ) : (
              <span className={styles.dateEmpty} aria-label={t("setDate")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
            )}
          </button>
        )}
      </td>

      <td className={styles.cell} onClick={stop}>
        <select
          className={styles.pillSelect}
          value={currentStatus}
          onChange={(e) =>
            onUpdate(task.id, {
              status: normalizeStatus(e.target.value) as TaskStatus,
            })
          }
          style={statusStyle(currentStatus)}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {getStatusLabel(s, locale)}
            </option>
          ))}
        </select>
      </td>

      <td className={styles.cell} onClick={stop}>
        <TaskTagEditor task={task} onUpdate={onUpdate} />
      </td>

      <td className={styles.cell} onClick={stop}>
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(task.id)}
          title={t("delete")}
          type="button"
        >
          ×
        </button>
      </td>
    </tr>
  );
}
