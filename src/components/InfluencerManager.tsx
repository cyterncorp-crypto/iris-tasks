"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Influencer } from "@/lib/types";
import {
  deleteInfluencerPhoto,
  uploadInfluencerPhoto,
  checkStorageAvailable,
} from "@/lib/upload-photo";
import { buildUniqueSlug, getInfluencerProfilePath, slugifyName } from "@/lib/influencer-slug";
import { useT } from "@/lib/i18n/LocaleProvider";
import TranslatedText from "./TranslatedText";
import TranslationPreview from "./TranslationPreview";
import AppNav from "./AppNav";
import PhotoUpload from "./PhotoUpload";
import styles from "./InfluencerManager.module.css";

interface InfluencerWithCount extends Influencer {
  task_count: number;
}

export default function InfluencerManager() {
  const { t, locale, translateTexts } = useT();
  const [influencers, setInfluencers] = useState<InfluencerWithCount[]>([]);
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editCurrentPhoto, setEditCurrentPhoto] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState(0);
  const [storageOk, setStorageOk] = useState<boolean | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const existingSlugs = useCallback(
    () =>
      influencers
        .map((i) => i.slug ?? slugifyName(i.name))
        .filter(Boolean),
    [influencers]
  );

  const fetchInfluencers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const { data: infs, error: infErr } = await supabase
        .from("influencers")
        .select("*")
        .order("name");

      if (infErr) {
        setError(infErr.message);
        setInfluencers([]);
        return;
      }

      const counts = new Map<string, number>();

      const { data: tasks, error: tasksErr } = await supabase
        .from("tasks")
        .select("influencer_id");

      if (!tasksErr) {
        for (const task of tasks ?? []) {
          if (task.influencer_id) {
            counts.set(task.influencer_id, (counts.get(task.influencer_id) ?? 0) + 1);
          }
        }
      }

      setInfluencers(
        (infs ?? []).map((i) => ({
          ...i,
          task_count: counts.get(i.id) ?? 0,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorLoadInfluencers"));
      setInfluencers([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchInfluencers();
  }, [fetchInfluencers]);

  useEffect(() => {
    checkStorageAvailable().then(setStorageOk);
  }, []);

  useEffect(() => {
    if (locale !== "ru" || loading) return;
    const names = influencers.map((inf) => inf.name).filter((n) => n?.trim());
    if (names.length > 0) void translateTexts(names, true);
  }, [locale, loading, influencers, translateTexts]);

  const createInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const trimmedName = name.trim();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadInfluencerPhoto(photoFile);
      }

      const slug = await buildUniqueSlug(trimmedName, existingSlugs());

      const { error: err } = await supabase.from("influencers").insert({
        name: trimmedName,
        photo_url: photoUrl,
        slug,
      });

      if (err) throw err;

      setName("");
      setPhotoFile(null);
      setPhotoKey((k) => k + 1);
      setSuccess(
        photoFile
          ? t("createdWithPhoto", { name: trimmedName })
          : t("created", { name: trimmedName })
      );
      await fetchInfluencers(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorCreateInfluencer"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (inf: Influencer) => {
    setEditingId(inf.id);
    setEditName(inf.name);
    setEditCurrentPhoto(inf.photo_url);
    setEditPhotoFile(null);
  };

  const saveEdit = async (id: string, previousPhotoUrl: string | null, currentSlug?: string | null) => {
    setSaving(true);
    setError(null);

    try {
      let photoUrl = previousPhotoUrl;

      if (editPhotoFile) {
        photoUrl = await uploadInfluencerPhoto(editPhotoFile);
        if (previousPhotoUrl) {
          await deleteInfluencerPhoto(previousPhotoUrl);
        }
      }

      const slug = await buildUniqueSlug(editName.trim(), existingSlugs(), currentSlug);

      const { error: err } = await supabase
        .from("influencers")
        .update({
          name: editName.trim(),
          photo_url: photoUrl,
          slug,
        })
        .eq("id", id);

      if (err) throw err;

      setEditingId(null);
      setEditPhotoFile(null);
      await fetchInfluencers(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const deleteInfluencer = async (inf: Influencer) => {
    if (!confirm(t("confirmDeleteInfluencer"))) return;

    const { error: err } = await supabase
      .from("influencers")
      .delete()
      .eq("id", inf.id);

    if (err) {
      setError(err.message);
    } else {
      if (inf.photo_url) await deleteInfluencerPhoto(inf.photo_url);
      fetchInfluencers(true);
    }
  };

  const errorMessage =
    error &&
    (error.includes("relation") || error.includes("does not exist")
      ? t("tableNotFound")
      : error.includes("Bucket not found") || error.includes("migration-storage")
        ? t("storageNotConfigured")
        : error);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{t("influencers")}</h1>
          <AppNav />
        </div>
      </header>

      {storageOk && (
        <div className={styles.success}>{t("storageConnected")}</div>
      )}

      {success && <div className={styles.success}>{success}</div>}
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}

      <section className={styles.formCard}>
        <h2 className={styles.sectionTitle}>{t("newInfluencer")}</h2>
        <form className={styles.form} onSubmit={createInfluencer}>
          <input
            className={styles.input}
            placeholder={t("influencerNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TranslationPreview
            text={name}
            className={styles.translationPreview}
          />
          <PhotoUpload key={photoKey} onFileSelect={setPhotoFile} />
          <button className={styles.submitBtn} type="submit" disabled={saving}>
            {saving ? t("saving") : t("createInfluencer")}
          </button>
        </form>
      </section>

      <section className={styles.listSection}>
        <h2 className={styles.sectionTitle}>
          {loading
            ? t("loading")
            : t("influencersCount", { count: influencers.length })}
        </h2>

        {loading ? (
          <p className={styles.empty}>{t("loadingInfluencers")}</p>
        ) : influencers.length === 0 ? (
          <p className={styles.empty}>{t("noInfluencers")}</p>
        ) : (
          <div className={styles.grid}>
            {influencers.map((inf) => (
              <article key={inf.id} className={styles.card}>
                {editingId === inf.id ? (
                  <div className={styles.editForm}>
                    <input
                      className={styles.input}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <TranslationPreview
                      text={editName}
                      className={styles.translationPreview}
                    />
                    <PhotoUpload
                      currentUrl={editCurrentPhoto}
                      onFileSelect={setEditPhotoFile}
                    />
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.saveBtn}
                        disabled={saving}
                        onClick={() => saveEdit(inf.id, inf.photo_url, inf.slug)}
                      >
                        {saving ? t("saving") : t("save")}
                      </button>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => setEditingId(null)}
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link href={getInfluencerProfilePath(inf)} className={styles.cardLink}>
                      {inf.photo_url ? (
                        <img src={inf.photo_url} alt="" className={styles.avatar} />
                      ) : (
                        <span className={styles.avatarPlaceholder}>
                          {inf.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className={styles.cardInfo}>
                        <TranslatedText text={inf.name} className={styles.cardName} />
                        <span className={styles.cardCount}>
                          {t("taskCount", { count: inf.task_count })}
                        </span>
                      </div>
                    </Link>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => startEdit(inf)}
                      >
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => deleteInfluencer(inf)}
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
