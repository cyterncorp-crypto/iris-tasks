"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import styles from "./LocaleToggle.module.css";

export default function LocaleToggle() {
  const { locale, setLocale, t, translating } = useLocale();

  return (
    <div className={styles.wrap} role="group" aria-label={t("language")}>
      <button
        type="button"
        className={`${styles.btn} ${locale === "pt" ? styles.active : ""}`}
        onClick={() => setLocale("pt")}
      >
        PT
      </button>
      <button
        type="button"
        className={`${styles.btn} ${locale === "ru" ? styles.active : ""} ${translating ? styles.busy : ""}`}
        onClick={() => setLocale("ru")}
        title={translating ? "…" : undefined}
      >
        RU{translating ? " …" : ""}
      </button>
    </div>
  );
}
