"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "./error.module.css";

export default function InfluenciadoresError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{t("errorLoadInfluencers")}</h1>
      <p className={styles.message}>
        {error.message.includes("Cannot find module") || error.message.includes("ChunkLoadError")
          ? t("errorCacheStale")
          : error.message}
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={reset}>
          {t("tryAgain")}
        </button>
        <Link href="/" className={styles.link}>
          {t("errorPageBack")}
        </Link>
      </div>
    </div>
  );
}
