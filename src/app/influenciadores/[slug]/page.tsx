"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Influencer, Task } from "@/lib/types";
import { LocaleProvider, useT } from "@/lib/i18n/LocaleProvider";
import TaskBoardClient from "@/components/TaskBoardClient";
import InfluencerProgressBar from "@/components/InfluencerProgressBar";
import InfluencerLoginCredentials from "@/components/InfluencerLoginCredentials";
import LocaleToggle from "@/components/LocaleToggle";
import styles from "./profile.module.css";

function InfluencerProfileContent({
  influencer,
}: {
  influencer: Influencer;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);

  return (
    <div>
      <div className={styles.profileBanner}>
        <div className={styles.profileTopRow}>
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
            <InfluencerLoginCredentials influencer={influencer} />
          </div>
          <LocaleToggle />
        </div>
        <InfluencerProgressBar tasks={tasks} />
      </div>

      <TaskBoardClient
        influencerId={influencer.id}
        hideInfluencerColumns
        influencerView
        onTasksChange={setTasks}
      />
    </div>
  );
}

function InfluencerProfilePageInner() {
  const params = useParams();
  const slug = params.slug as string;
  const { t } = useT();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      </div>
    );
  }

  return <InfluencerProfileContent influencer={influencer} />;
}

export default function InfluencerProfilePage() {
  return (
    <LocaleProvider storageKey="sayyo-locale-influencer" defaultLocale="ru">
      <InfluencerProfilePageInner />
    </LocaleProvider>
  );
}
