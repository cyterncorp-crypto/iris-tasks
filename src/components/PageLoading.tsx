"use client";

import { useT } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import styles from "./TaskBoard.module.css";

export default function PageLoading({
  messageKey = "loading",
}: {
  messageKey?: MessageKey;
}) {
  const { t } = useT();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.title}>{t("appTitle")}</h1>
          </div>
        </div>
      </header>
      <div className={styles.loading}>{t(messageKey)}</div>
    </div>
  );
}
