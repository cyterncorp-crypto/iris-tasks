"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Influencer, Task, TaskStatus, TaskUpdate } from "@/lib/types";
import { getInfluencerName } from "@/lib/types";
import {
  collectTaskDateKeys,
  formatFilterDayLabel,
  formatDueDateGroupLabel,
  dueDateGroupColor,
  groupTasksByDueDate,
  isAllTasksFilter,
  NO_DUE_DATE_KEY,
} from "@/lib/task-utils";
import { checklistMatchesSearch, getTaskChecklist } from "@/lib/checklist-utils";
import { getTaskTags } from "@/lib/tag-utils";
import { buildTaskCopyPayload } from "@/lib/task-copy-utils";
import { getTaskImages } from "@/lib/task-images-utils";
import { duplicateTaskImages } from "@/lib/upload-photo";
import { collectTranslatableTexts } from "@/lib/collect-translatable-texts";
import { useT } from "@/lib/i18n/LocaleProvider";
import TranslatedText from "./TranslatedText";
import AppNav from "./AppNav";
import TaskGroup from "./TaskGroup";
import TaskDetailModal from "./TaskDetailModal";
import styles from "./TaskBoard.module.css";

const TASK_SELECT = "*, influencer:influencers(id, name, photo_url)";

interface TaskBoardProps {
  influencerId?: string;
  title?: string;
  subtitle?: string;
  hideInfluencerColumns?: boolean;
  influencerView?: boolean;
  onTasksChange?: (tasks: Task[]) => void;
}

export default function TaskBoard({
  influencerId,
  title = "Sayyo Tasks",
  subtitle,
  hideInfluencerColumns = false,
  influencerView = false,
  onTasksChange,
}: TaskBoardProps) {
  const { t, td, locale, translateTexts, subscribeLocalePrefetch } = useT();
  const displayTitle = title === "Sayyo Tasks" ? t("appTitle") : title;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [copyToAllInfluencers, setCopyToAllInfluencers] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<"principal" | "geral" | string>("principal");
  const [ruPreparing, setRuPreparing] = useState(false);
  const [ruReadySignature, setRuReadySignature] = useState("");
  const [dateFilterExpanded, setDateFilterExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);

    try {
      let taskQuery = supabase
        .from("tasks")
        .select(TASK_SELECT)
        .order("created_at", { ascending: false });

      if (influencerId) {
        taskQuery = taskQuery.eq("influencer_id", influencerId);
      }

      const [tasksRes, influencersRes] = await Promise.all([
        taskQuery,
        supabase.from("influencers").select("*").order("name"),
      ]);

      if (tasksRes.error) {
        setError(tasksRes.error.message);
        setTasks([]);
      } else {
        setTasks((tasksRes.data as Task[]) ?? []);
      }

      if (!influencersRes.error) {
        setInfluencers(influencersRes.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorLoadTasks"));
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [influencerId, t]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const boardTranslationTexts = useMemo(
    () => collectTranslatableTexts(tasks),
    [tasks]
  );
  const boardTranslationSignature = useMemo(
    () => boardTranslationTexts.join("\u0001"),
    [boardTranslationTexts]
  );

  const prefetchAllTexts = useCallback(() => {
    const texts = collectTranslatableTexts(tasksRef.current);
    if (texts.length > 0) {
      void translateTexts(texts, true, { immediate: true });
    }
  }, [translateTexts]);

  useEffect(() => {
    return subscribeLocalePrefetch(prefetchAllTexts);
  }, [subscribeLocalePrefetch, prefetchAllTexts]);

  useEffect(() => {
    if (!loading) {
      onTasksChange?.(tasks);
    }
  }, [tasks, loading, onTasksChange]);

  useEffect(() => {
    if (locale !== "ru" || loading) return;
    prefetchAllTexts();
  }, [locale, tasks, loading, prefetchAllTexts]);

  useEffect(() => {
    if (locale !== "ru" || loading) {
      setRuPreparing(false);
      return;
    }

    if (!boardTranslationSignature) {
      setRuReadySignature("");
      setRuPreparing(false);
      return;
    }

    let active = true;
    setRuPreparing(true);

    void translateTexts(boardTranslationTexts, true, { immediate: true })
      .then(() => {
        if (active) setRuReadySignature(boardTranslationSignature);
      })
      .finally(() => {
        if (active) setRuPreparing(false);
      });

    return () => {
      active = false;
    };
  }, [
    locale,
    loading,
    boardTranslationTexts,
    boardTranslationSignature,
    translateTexts,
  ]);

  const updateTask = useCallback(
    async (id: string, updates: TaskUpdate) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...updates };
          if ("influencer_id" in updates) {
            const inf = influencers.find((i) => i.id === updates.influencer_id);
            next.influencer = inf ?? null;
          }
          return next;
        })
      );

      const { error: err } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id);

      if (err) {
        setError(err.message);
        fetchData();
        throw new Error(err.message);
      }
    },
    [fetchData, influencers]
  );

  const selectedTask = useMemo(
    () => (selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null),
    [selectedTaskId, tasks]
  );

  const createTask = useCallback(
    async (
      status: TaskStatus = "em andamento",
      dueDate?: string | null
    ) => {
      setError(null);
      setSuccess(null);

      const forAll =
        copyToAllInfluencers && !influencerId && influencers.length > 0;

      if (copyToAllInfluencers && !influencerId && influencers.length === 0) {
        setError(t("registerInfluencersFirst"));
        return;
      }

      if (forAll) {
        const inserts = influencers.map((inf) => ({
          title: "Nova tarefa",
          status,
          influencer_id: inf.id,
          ...(dueDate ? { due_date: dueDate } : {}),
        }));

        const { data, error: err } = await supabase
          .from("tasks")
          .insert(inserts)
          .select(TASK_SELECT);

        if (err) {
          setError(err.message);
        } else if (data) {
          setTasks((prev) => [...(data as Task[]), ...prev]);
          setSuccess(t("tasksCreatedForAll", { count: data.length }));
        }
        return;
      }

      const insert: Record<string, unknown> = { title: "Nova tarefa", status };
      if (influencerId) insert.influencer_id = influencerId;
      if (dueDate) insert.due_date = dueDate;

      const { data, error: err } = await supabase
        .from("tasks")
        .insert(insert)
        .select(TASK_SELECT)
        .single();

      if (err) {
        setError(err.message);
      } else if (data) {
        setTasks((prev) => [data as Task, ...prev]);
      }
    },
    [influencerId, influencers, copyToAllInfluencers, t]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      const { error: err } = await supabase.from("tasks").delete().eq("id", id);
      if (err) {
        setError(err.message);
        fetchData();
      }
    },
    [fetchData]
  );

  const copyTask = useCallback(
    async (source: Task, targetIds: string[]) => {
      if (targetIds.length === 0) return;

      setError(null);
      setSuccess(null);

      // Cada cópia recebe arquivos próprios no storage (não compartilha URL)
      const sourceImages = getTaskImages(source);
      const inserts = [];
      for (const id of targetIds) {
        const images =
          sourceImages.length > 0
            ? await duplicateTaskImages(sourceImages)
            : [];
        inserts.push(buildTaskCopyPayload(source, id, images));
      }

      const { data, error: err } = await supabase
        .from("tasks")
        .insert(inserts)
        .select(TASK_SELECT);

      if (err) {
        setError(err.message);
        throw new Error(err.message);
      }

      if (data) {
        const created = data as Task[];
        if (!influencerId) {
          setTasks((prev) => [...created, ...prev]);
        }
        setSuccess(
          created.length === 1
            ? t("taskCopied")
            : t("tasksCopied", { count: created.length })
        );
      }
    },
    [influencerId, t]
  );

  const availableDays = useMemo(() => collectTaskDateKeys(tasks), [tasks]);

  useEffect(() => {
    if (!isAllTasksFilter(dateFilter) && !availableDays.includes(dateFilter)) {
      setDateFilter("principal");
    }
  }, [availableDays, dateFilter]);

  const dayCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tasks) {
      if (!t.due_date) continue;
      counts.set(t.due_date, (counts.get(t.due_date) ?? 0) + 1);
    }
    return counts;
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (!isAllTasksFilter(dateFilter) && t.due_date !== dateFilter) return false;
      if (!showClosed && t.status === "feito") return false;
      if (influencerView) return true;

      const q = search.toLowerCase().trim();
      if (!q) return true;

      const titleRu = locale === "ru" ? td(t.title).toLowerCase() : "";
      const titleMatch =
        t.title.toLowerCase().includes(q) || titleRu.includes(q);

      const checklist = getTaskChecklist(t);
      const checklistMatch =
        checklistMatchesSearch(checklist, q) ||
        (locale === "ru" &&
          checklist.some((item) => td(item.text).toLowerCase().includes(q)));

      const influencerName = getInfluencerName(t);
      const influencerMatch =
        influencerName?.toLowerCase().includes(q) ?? false;

      const tagMatch = getTaskTags(t).some((tag) => {
        const label = tag.label.toLowerCase();
        const labelRu = locale === "ru" ? td(tag.label).toLowerCase() : "";
        return label.includes(q) || labelRu.includes(q);
      });

      return titleMatch || checklistMatch || influencerMatch || tagMatch;
    });
  }, [tasks, search, showClosed, dateFilter, locale, td, influencerView]);

  const groupedByDate = useMemo(
    () => groupTasksByDueDate(filtered),
    [filtered]
  );

  const activeDateFilterLabel = useMemo(() => {
    if (dateFilter === "principal") return t("principal");
    if (dateFilter === "geral") return t("general");
    return formatFilterDayLabel(dateFilter, locale);
  }, [dateFilter, locale, t]);

  const selectDateFilter = (value: typeof dateFilter) => {
    setDateFilter(value);
    if (influencerView) setDateFilterExpanded(false);
  };

  const pageClass = influencerView ? `${styles.page} ${styles.pageInfluencer}` : styles.page;

  const dateFilterTabs = (
    <>
      <button
        type="button"
        className={`${styles.dateFilterTab} ${dateFilter === "principal" ? styles.dateFilterTabActive : ""}`}
        onClick={() => selectDateFilter("principal")}
      >
        {t("principal")}
        <span className={styles.dateFilterCount}>{tasks.length}</span>
      </button>
      <button
        type="button"
        className={`${styles.dateFilterTab} ${dateFilter === "geral" ? styles.dateFilterTabActive : ""}`}
        onClick={() => selectDateFilter("geral")}
      >
        {t("general")}
        <span className={styles.dateFilterCount}>{tasks.length}</span>
      </button>
      {availableDays.length > 0 && <span className={styles.dateFilterDivider} />}
      {availableDays.map((day) => (
        <button
          key={day}
          type="button"
          className={`${styles.dateFilterTab} ${dateFilter === day ? styles.dateFilterTabActive : ""}`}
          onClick={() => selectDateFilter(day)}
        >
          {formatFilterDayLabel(day, locale)}
          <span className={styles.dateFilterCount}>{dayCounts.get(day) ?? 0}</span>
        </button>
      ))}
    </>
  );

  if (loading) {
    return (
      <div className={pageClass}>
        {!influencerView && (
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <div>
                <h1 className={styles.title}>
                  {title === "Sayyo Tasks" ? (
                    displayTitle
                  ) : (
                    <TranslatedText text={displayTitle} />
                  )}
                </h1>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
              <AppNav />
            </div>
          </header>
        )}
        <div className={styles.loading}>{t("loadingTasks")}</div>
      </div>
    );
  }

  const waitingForRussian =
    locale === "ru" &&
    !!boardTranslationSignature &&
    (ruPreparing || ruReadySignature !== boardTranslationSignature);

  if (waitingForRussian) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div>
              <h1 className={styles.title}>{title}</h1>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <AppNav />
          </div>
        </header>
        <div className={styles.translationLoading}>
          <div className={styles.translationSpinner} aria-hidden />
          <div>
            <p className={styles.translationTitle}>Подготавливаем русский интерфейс</p>
            <p className={styles.translationHint}>Задачи появятся после завершения перевода.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      {!influencerView && (
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div>
              <h1 className={styles.title}>{title}</h1>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <AppNav />
          </div>
          <div className={styles.headerRight}>
            <input
              className={styles.search}
              placeholder={t("searchTasks")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className={styles.badge}>{t("groupByDueDate")}</span>
          </div>
        </header>
      )}

      <div className={influencerView ? styles.toolbarCompact : styles.toolbar}>
        {!influencerView && (
          <span className={styles.count}>{t("tasksCount", { count: filtered.length })}</span>
        )}
        <div className={styles.toolbarRight}>
          {!hideInfluencerColumns && influencers.length > 0 && (
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={copyToAllInfluencers}
                onChange={(e) => setCopyToAllInfluencers(e.target.checked)}
              />
              {t("copyToAllInfluencers")}
            </label>
          )}
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
            />
            {t("showCompleted")}
          </label>
        </div>
      </div>

      <div className={influencerView ? styles.dateFilterBarCompact : styles.dateFilterBar}>
        {influencerView ? (
          <>
            <button
              type="button"
              className={styles.dateFilterToggle}
              onClick={() => setDateFilterExpanded((open) => !open)}
              aria-expanded={dateFilterExpanded}
            >
              <span className={styles.dateFilterToggleLabel}>
                {t("filterByDay")}: {activeDateFilterLabel}
              </span>
              <span className={styles.dateFilterChevron} aria-hidden>
                {dateFilterExpanded ? "▾" : "▸"}
              </span>
            </button>
            {dateFilterExpanded && (
              <div className={styles.dateFilterPanel}>{dateFilterTabs}</div>
            )}
          </>
        ) : (
          <>
            <span className={styles.dateFilterLabel}>{t("filterByDay")}</span>
            <div className={styles.dateFilterTabs}>{dateFilterTabs}</div>
          </>
        )}
      </div>

      {success && <div className={styles.success}>{success}</div>}

      {error && (
        <div className={styles.error}>
          {error.includes("relation") || error.includes("does not exist") || error.includes("checklist") || error.includes("enum") || error.includes("nao realizado")
            ? t("dbOutdated")
            : error}
        </div>
      )}

      <div className={styles.board}>
        {groupedByDate.map(({ key, tasks: items }) => (
          <TaskGroup
            key={key}
            groupKey={key}
            label={formatDueDateGroupLabel(key, locale)}
            color={dueDateGroupColor(key)}
            tasks={items}
            influencers={influencers}
            hideInfluencerColumns={hideInfluencerColumns}
            hideDateColumn={influencerView}
            compact={influencerView}
            onUpdate={updateTask}
            onOpen={(task) => setSelectedTaskId(task.id)}
            onCreate={() =>
              createTask(
                "em andamento",
                key === NO_DUE_DATE_KEY ? null : key
              )
            }
            onDelete={deleteTask}
            copyToAllInfluencers={copyToAllInfluencers}
          />
        ))}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          influencers={influencers}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
          onCopy={copyTask}
        />
      )}
    </div>
  );
}
