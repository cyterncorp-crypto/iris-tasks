"use client";

import { useState } from "react";
import type { DisplayStatus, Influencer, Task, TaskUpdate } from "@/lib/types";
import { useT } from "@/lib/i18n/LocaleProvider";
import TaskRow from "./TaskRow";
import styles from "./TaskGroup.module.css";

interface Props {
  groupKey: string;
  label: string;
  color: string;
  tasks: Task[];
  influencers: Influencer[];
  hideInfluencerColumns?: boolean;
  hideDateColumn?: boolean;
  compact?: boolean;
  onUpdate: (id: string, updates: TaskUpdate) => void;
  onOpen: (task: Task) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  copyToAllInfluencers?: boolean;
}

export default function TaskGroup({
  groupKey,
  label,
  color,
  tasks,
  influencers,
  hideInfluencerColumns = false,
  hideDateColumn = false,
  compact = false,
  onUpdate,
  onOpen,
  onCreate,
  onDelete,
  copyToAllInfluencers = false,
}: Props) {
  const { t } = useT();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className={styles.group}>
      <button
        className={styles.groupHeader}
        onClick={() => setCollapsed(!collapsed)}
        type="button"
      >
        <span className={styles.chevron}>{collapsed ? "▸" : "▾"}</span>
        <span className={styles.badge} style={{ background: color }}>
          {label}
        </span>
        <span className={styles.count}>{tasks.length}</span>
      </button>

      {!collapsed && (
        <div className={styles.tableWrap}>
          <table
            className={`${styles.table} ${compact ? styles.tableCompact : ""}`}
          >
            <thead>
              <tr>
                <th className={styles.colName}>{t("taskName")}</th>
                {!hideInfluencerColumns && (
                  <>
                    <th className={styles.colPhoto}>{t("photo")}</th>
                    <th className={styles.colInfluencer}>{t("influencer")}</th>
                  </>
                )}
                {!hideDateColumn && (
                  <th className={styles.colDate}>{t("dueDate")}</th>
                )}
                <th className={styles.colStatus}>{t("status")}</th>
                <th className={styles.colTag}>{t("tag")}</th>
                <th className={styles.colActions} />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  influencers={influencers}
                  hideInfluencerColumns={hideInfluencerColumns}
                  hideDateColumn={hideDateColumn}
                  compact={compact}
                  onUpdate={onUpdate}
                  onOpen={() => onOpen(task)}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
          <button className={styles.addBtn} onClick={onCreate} type="button">
            {copyToAllInfluencers ? t("newTaskForAll") : t("addTask")}
          </button>
        </div>
      )}
    </section>
  );
}
