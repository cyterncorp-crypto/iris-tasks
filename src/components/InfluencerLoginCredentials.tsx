"use client";

import type { Influencer } from "@/lib/types";
import { getInfluencerCredentials } from "@/lib/influencer-credentials";
import { useT } from "@/lib/i18n/LocaleProvider";
import styles from "./InfluencerLoginCredentials.module.css";

interface Props {
  influencer: Pick<Influencer, "slug" | "name">;
}

export default function InfluencerLoginCredentials({ influencer }: Props) {
  const { t } = useT();
  const credentials = getInfluencerCredentials(influencer);

  if (!credentials) return null;

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
