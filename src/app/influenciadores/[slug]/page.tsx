"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Influencer, Task } from "@/lib/types";
import { useT } from "@/lib/i18n/LocaleProvider";
import TaskBoardClient from "@/components/TaskBoardClient";
import InfluencerProgressBar from "@/components/InfluencerProgressBar";
import TranslatedText from "@/components/TranslatedText";
import styles from "./profile.module.css";

export default function InfluencerProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { t } = useT();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const query = isUuid
      ? supabase.from("influencers").select("*").eq("id", slug)
      : supabase.from("influencers").select("*").eq("slug", slug);

    query.single().then(({ data, error }) => {
      if (error || !data) {
        setNotFound(true);
      } else {
        setInfluencer(data);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return <div className={styles.loading}>{t("loadingProfile")}</div>;
  }

  if (notFound || !influencer) {
    return (
      <div className={styles.notFound}>
        <p>{t("influencerNotFound")}</p>
        <Link href="/influenciadores">{t("backToInfluencers")}</Link>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.profileBanner}>
        <Link href="/influenciadores" className={styles.backLink}>
          {t("backInfluencers")}
        </Link>
        <div className={styles.profileHeader}>
          {influencer.photo_url ? (
            <img
              src={influencer.photo_url}
              alt=""
              className={styles.profileAvatar}
            />
          ) : (
            <span className={styles.profileAvatarPlaceholder}>
              {influencer.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className={styles.profileName}>
              <TranslatedText text={influencer.name} />
            </h1>
            <p className={styles.profileSub}>{t("profileTasksSubtitle")}</p>
          </div>
        </div>
        <InfluencerProgressBar tasks={tasks} />
      </div>

      <TaskBoardClient
        influencerId={influencer.id}
        title={influencer.name}
        subtitle={t("profileTasksOnly")}
        hideInfluencerColumns
        onTasksChange={setTasks}
      />
    </div>
  );
}
