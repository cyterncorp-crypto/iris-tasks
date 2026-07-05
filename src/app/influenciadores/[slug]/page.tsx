"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Influencer, Task } from "@/lib/types";
import { LocaleProvider, useT } from "@/lib/i18n/LocaleProvider";
import TaskBoardClient from "@/components/TaskBoardClient";
import InfluencerProfileCard from "@/components/InfluencerProfileCard";
import InfluencerOnboardingModal from "@/components/InfluencerOnboardingModal";
import styles from "./profile.module.css";

function shouldShowOnboarding(influencer: Influencer): boolean {
  if (influencer.subscription_price_rub != null) return false;
  if (influencer.onboarding_completed) return false;
  return true;
}

function InfluencerProfileContent({
  influencer: initialInfluencer,
}: {
  influencer: Influencer;
}) {
  const [influencer, setInfluencer] = useState(initialInfluencer);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(() =>
    shouldShowOnboarding(initialInfluencer)
  );

  const handleInfluencerUpdate = useCallback((updates: Partial<Influencer>) => {
    setInfluencer((prev) => ({ ...prev, ...updates }));
    if (updates.subscription_price_rub != null) {
      setShowOnboarding(false);
    }
  }, []);

  const handleOnboardingComplete = useCallback(
    async (priceRub: number) => {
      const { error } = await supabase
        .from("influencers")
        .update({
          subscription_price_rub: priceRub,
          onboarding_completed: true,
        })
        .eq("id", influencer.id);
      if (error) throw error;
      handleInfluencerUpdate({
        subscription_price_rub: priceRub,
        onboarding_completed: true,
      });
      setShowOnboarding(false);
    },
    [influencer.id, handleInfluencerUpdate]
  );

  const handleOnboardingDismiss = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  return (
    <div>
      {showOnboarding && (
        <InfluencerOnboardingModal
          influencer={influencer}
          onComplete={handleOnboardingComplete}
          onDismiss={handleOnboardingDismiss}
        />
      )}

      <InfluencerProfileCard
        influencer={influencer}
        tasks={tasks}
        onInfluencerUpdate={handleInfluencerUpdate}
      />

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
