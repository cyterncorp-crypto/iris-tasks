"use client";

import { useEffect, useRef, useState } from "react";
import type { ChecklistItem } from "@/lib/types";
import { checklistProgress, createChecklistItem } from "@/lib/checklist-utils";
import { expandTextsForTranslation } from "@/lib/translate-text";
import { useT } from "@/lib/i18n/LocaleProvider";
import FormattedChecklistText from "./FormattedChecklistText";
import styles from "./TaskChecklist.module.css";

interface Props {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  disabled?: boolean;
}

function AutoTextarea({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder,
  done,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  done?: boolean;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 72)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <textarea
      ref={ref}
      className={`${styles.textArea} ${done ? styles.textAreaDone : ""}`}
      value={value}
      disabled={disabled}
      rows={3}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  );
}

function ChecklistItemField({
  item,
  disabled,
  onChange,
  checklistPlaceholder,
  checklistReadPlaceholder,
  previewLabel,
}: {
  item: ChecklistItem;
  disabled?: boolean;
  onChange: (text: string) => void;
  checklistPlaceholder: string;
  checklistReadPlaceholder: string;
  previewLabel: string;
}) {
  const [focused, setFocused] = useState(false);

  if (focused) {
    return (
      <div className={styles.fieldWrap}>
        <AutoTextarea
          value={item.text}
          done={item.done}
          disabled={disabled}
          autoFocus
          placeholder={checklistPlaceholder}
          onChange={onChange}
          onBlur={() => setFocused(false)}
        />
        {item.text.trim() && (
          <div className={`${styles.preview} ${item.done ? styles.previewDone : ""}`}>
            <span className={styles.previewLabel}>{previewLabel}</span>
            <FormattedChecklistText text={item.text} done={item.done} />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.readBtn} ${item.done ? styles.readBtnDone : ""}`}
      disabled={disabled}
      onClick={() => setFocused(true)}
    >
      {item.text.trim() ? (
        <FormattedChecklistText text={item.text} done={item.done} />
      ) : (
        <span className={styles.readPlaceholder}>{checklistReadPlaceholder}</span>
      )}
    </button>
  );
}

export default function TaskChecklist({ items, onChange, disabled }: Props) {
  const { t, locale, translateTexts } = useT();
  const [newText, setNewText] = useState("");
  const addRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (locale !== "ru") return;
    const texts = items.map((item) => item.text).filter((s) => s?.trim());
    if (texts.length > 0) {
      void translateTexts(expandTextsForTranslation(texts), true);
    }
  }, [locale, items, translateTexts]);

  const doneCount = items.filter((i) => i.done).length;
  const progress = checklistProgress(items);

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const addItem = () => {
    const text = newText.trim();
    if (!text) return;
    onChange([...items, createChecklistItem(text)]);
    setNewText("");
    addRef.current?.focus();
  };

  const renderItem = (item: ChecklistItem) => (
    <div
      key={item.id}
      className={`${styles.item} ${item.done ? styles.itemDone : styles.itemPending}`}
    >
      <input
        type="checkbox"
        className={`${styles.checkbox} ${item.done ? styles.checkboxDone : ""}`}
        checked={item.done}
        disabled={disabled}
        onChange={(e) => updateItem(item.id, { done: e.target.checked })}
        aria-label={item.text}
      />
      <ChecklistItemField
        item={item}
        disabled={disabled}
        onChange={(text) => updateItem(item.id, { text })}
        checklistPlaceholder={t("checklistPlaceholder")}
        checklistReadPlaceholder={t("checklistReadPlaceholder")}
        previewLabel={t("preview")}
      />
      <button
        type="button"
        className={styles.removeBtn}
        disabled={disabled}
        onClick={() => removeItem(item.id)}
        aria-label={t("remove")}
      >
        ×
      </button>
    </div>
  );

  return (
    <div className={styles.wrap}>
      {items.length > 0 && (
        <p className={styles.progressHint}>
          {t("checklistDone", { done: doneCount, total: items.length, percent: progress })}
          {doneCount === items.length && (
            <span className={styles.allDoneBadge}>{t("allChecklistDone")}</span>
          )}
        </p>
      )}

      <p className={styles.formatHint}>{t("formatHint")}</p>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t("todoSection")}</h3>
        <div className={styles.checklist}>
          {items.length === 0 ? (
            <p className={styles.empty}>{t("noChecklistSteps")}</p>
          ) : (
            items.map(renderItem)
          )}
        </div>
      </div>

      <div className={styles.addSection}>
        <label className={styles.addLabel} htmlFor="new-checklist-item">
          {t("newStep")}
        </label>
        <textarea
          id="new-checklist-item"
          ref={addRef}
          className={styles.addTextarea}
          value={newText}
          disabled={disabled}
          rows={3}
          placeholder={t("newStepPlaceholder")}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              addItem();
            }
          }}
        />
        {newText.trim() && (
          <div className={styles.preview}>
            <span className={styles.previewLabel}>{t("preview")}</span>
            <FormattedChecklistText text={newText} />
          </div>
        )}
        <button
          type="button"
          className={styles.addBtn}
          disabled={disabled || !newText.trim()}
          onClick={addItem}
        >
          {t("addToList")}
        </button>
      </div>
    </div>
  );
}
