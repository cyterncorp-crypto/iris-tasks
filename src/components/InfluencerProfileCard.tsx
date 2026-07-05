"use client";

import type { Influencer, Task } from "@/lib/types";
import InfluencerLoginCredentials from "@/components/InfluencerLoginCredentials";
import InfluencerSubscriptionPrice from "@/components/InfluencerSubscriptionPrice";
import InfluencerProgressBar from "@/components/InfluencerProgressBar";
import LocaleToggle from "@/components/LocaleToggle";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "./InfluencerProfileCard.module.css";

interface Props {
  influencer: Influencer;
  tasks: Task[];
  onInfluencerUpdate: (updates: Partial<Influencer>) => void;
}

export default function InfluencerProfileCard({
  influencer,
  tasks,
  onInfluencerUpdate,
}: Props) {
  const { t } = useT();

  return (
    <header className={styles.pageHeader}>
      <div className={styles.topBar}>
        <span className={styles.brand}>{t("appTitle")}</span>
        <LocaleToggle />
      </div>

      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.avatarRing}>
              {influencer.photo_url ? (
                <img
                  src={influencer.photo_url}
                  alt=""
                  className={styles.avatar}
                />
              ) : (
                <span className={styles.avatarPlaceholder}>
                  {influencer.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className={styles.identity}>
              <div className={styles.nameRow}>
                <h1 className={styles.name}>{influencer.name}</h1>
                <VerifiedBadge />
              </div>
              <div className={styles.progressUnderName}>
                <InfluencerProgressBar tasks={tasks} variant="card" />
              </div>
            </div>

            <div className={styles.sections}>
              <InfluencerLoginCredentials
                influencer={influencer}
                variant="card"
              />
              <InfluencerSubscriptionPrice
                influencer={influencer}
                onUpdate={onInfluencerUpdate}
                variant="card"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
