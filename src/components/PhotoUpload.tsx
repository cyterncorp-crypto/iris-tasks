"use client";

import { useEffect, useRef, useState } from "react";
import { validatePhotoFile } from "@/lib/upload-photo";
import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "./PhotoUpload.module.css";

interface Props {
  currentUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  label?: string;
}

export default function PhotoUpload({
  currentUrl,
  onFileSelect,
  label,
}: Props) {
  const { t } = useT();
  const displayLabel = label ?? t("photoLabel");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(currentUrl ?? null);
  }, [currentUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);

    if (!file) {
      onFileSelect(null);
      setPreview(currentUrl ?? null);
      return;
    }

    const err = validatePhotoFile(file);
    if (err) {
      setFileError(err);
      onFileSelect(null);
      e.target.value = "";
      return;
    }

    onFileSelect(file);
    setPreview(URL.createObjectURL(file));
  };

  const clear = () => {
    onFileSelect(null);
    setPreview(currentUrl ?? null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{displayLabel}</span>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.previewBtn}
          onClick={() => inputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="" className={styles.preview} />
          ) : (
            <span className={styles.placeholder}>+</span>
          )}
        </button>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.pickBtn}
            onClick={() => inputRef.current?.click()}
          >
            {t("chooseFromPc")}
          </button>
          {preview && preview !== currentUrl && (
            <button type="button" className={styles.clearBtn} onClick={clear}>
              {t("cancel")}
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        className={styles.hidden}
        onChange={handleChange}
      />
      {fileError && <span className={styles.error}>{fileError}</span>}
      <span className={styles.hint}>{t("photoHint")}</span>
    </div>
  );
}
