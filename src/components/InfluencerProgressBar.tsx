"use client";

import type { Task } from "@/lib/types";
import { getInfluencerOverallProgress } from "@/lib/task-utils";
import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "./InfluencerProgressBar.module.css";

interface Props {
  tasks: Task[];
}

export default function InfluencerProgressBar({ tasks }: Props) {
  const { t } = useT();
  const { done, total, percent } = getInfluencerOverallProgress(tasks);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>{t("overallProgress")}</span>
        <span className={styles.stats}>
          {t("tasksCompleted", { done, total, percent })}
        </span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.fill}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("progressAria", { percent })}
        />
      </div>
    </div>
  );
}
