"use client";

import type { Task } from "@/lib/types";
import { getInfluencerOverallProgress } from "@/lib/task-utils";
import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "./InfluencerProgressBar.module.css";

interface Props {
  tasks: Task[];
  variant?: "inline" | "card";
}

export default function InfluencerProgressBar({ tasks, variant = "inline" }: Props) {
  const { t } = useT();
  const { done, total, percent } = getInfluencerOverallProgress(tasks);
  const isCard = variant === "card";

  return (
    <div className={isCard ? styles.cardWrap : styles.wrap}>
      <div className={styles.header}>
        <span className={isCard ? styles.cardLabel : styles.label}>
          {t("overallProgress")}
        </span>
        <span className={isCard ? styles.cardStats : styles.stats}>
          {t("tasksCompleted", { done, total, percent })}
        </span>
      </div>
      <div className={isCard ? styles.cardTrack : styles.track}>
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
