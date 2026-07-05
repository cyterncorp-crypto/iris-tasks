"use client";

import type { Influencer } from "@/lib/types";
import { getInfluencerCredentials } from "@/lib/influencer-credentials";
import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "./InfluencerLoginCredentials.module.css";

interface Props {
  influencer: Pick<Influencer, "slug" | "name">;
  variant?: "inline" | "card";
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function InfluencerLoginCredentials({
  influencer,
  variant = "inline",
}: Props) {
  const { t } = useT();
  const credentials = getInfluencerCredentials(influencer);

  if (!credentials) return null;

  if (variant === "card") {
    return (
      <section className={styles.cardSection} aria-label={t("loginCredentialsTitle")}>
        <h2 className={styles.cardSectionTitle}>{t("loginCredentialsTitle")}</h2>
        <div className={styles.cardRows}>
          <a
            href={credentials.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.infoRow}
          >
            <span className={styles.iconCircle}>
              <LinkIcon />
            </span>
            <span className={styles.rowContent}>
              <span className={styles.rowLabel}>{t("platformLink")}</span>
              <span className={styles.rowValue}>{credentials.platformUrl}</span>
            </span>
          </a>
          <div className={styles.credentialsRow}>
            <div className={styles.infoRow}>
              <span className={styles.iconCircle}>
                <UserIcon />
              </span>
              <span className={styles.rowContent}>
                <span className={styles.rowLabel}>{t("loginLabel")}</span>
                <span className={`${styles.rowValue} ${styles.rowValueMono}`}>
                  {credentials.login}
                </span>
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.iconCircle}>
                <LockIcon />
              </span>
              <span className={styles.rowContent}>
                <span className={styles.rowLabel}>{t("passwordLabel")}</span>
                <span className={`${styles.rowValue} ${styles.rowValueMono}`}>
                  {credentials.password}
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.wrap} aria-label={t("loginCredentialsTitle")}>
      <h2 className={styles.title}>{t("loginCredentialsTitle")}</h2>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>{t("platformLink")}</dt>
          <dd>
            <a
              href={credentials.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {credentials.platformUrl}
            </a>
          </dd>
        </div>
        <div className={styles.row}>
          <dt>{t("loginLabel")}</dt>
          <dd className={styles.mono}>{credentials.login}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t("passwordLabel")}</dt>
          <dd className={styles.mono}>{credentials.password}</dd>
        </div>
      </dl>
    </section>
  );
}
