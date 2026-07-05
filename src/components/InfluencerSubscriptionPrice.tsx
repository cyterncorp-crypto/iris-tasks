"use client";

import { useState } from "react";
import type { Influencer } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  formatRub,
  formatUsd,
  RECOMMENDED_USD_MAX,
  RECOMMENDED_USD_MIN,
  rubToUsd,
  usdToRub,
} from "@/lib/rub-usd";
import styles from "./InfluencerSubscriptionPrice.module.css";

interface Props {
  influencer: Influencer;
  onUpdate: (updates: Partial<Influencer>) => void;
  variant?: "inline" | "card";
}

function PriceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function InfluencerSubscriptionPrice({
  influencer,
  onUpdate,
  variant = "inline",
}: Props) {
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [priceRub, setPriceRub] = useState(
    influencer.subscription_price_rub?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedPrice = parseInt(priceRub.replace(/\s/g, ""), 10);
  const priceValid = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const usdEquivalent = priceValid ? rubToUsd(parsedPrice) : null;
  const hasPrice = influencer.subscription_price_rub != null;
  const isCard = variant === "card";

  async function handleSave() {
    if (!priceValid) {
      setError(t("onboardingPriceRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("influencers")
      .update({ subscription_price_rub: parsedPrice })
      .eq("id", influencer.id);
    setSaving(false);
    if (err) {
      setError(t("errorSave"));
      return;
    }
    onUpdate({ subscription_price_rub: parsedPrice });
    setEditing(false);
  }

  function handleCancel() {
    setPriceRub(influencer.subscription_price_rub?.toString() ?? "");
    setError(null);
    setEditing(false);
  }

  if (!hasPrice && !editing) {
    if (isCard) {
      return (
        <section className={styles.cardSection} aria-label={t("subscriptionPriceTitle")}>
          <h2 className={styles.cardSectionTitle}>{t("subscriptionPriceTitle")}</h2>
          <button
            type="button"
            className={styles.addRow}
            onClick={() => setEditing(true)}
          >
            <span className={styles.iconCircle}>
              <PriceIcon />
            </span>
            <span className={styles.addRowText}>{t("subscriptionSetPrice")}</span>
          </button>
        </section>
      );
    }

    return (
      <section className={styles.wrap} aria-label={t("subscriptionPriceTitle")}>
        <button
          type="button"
          className={styles.setBtn}
          onClick={() => setEditing(true)}
        >
          {t("subscriptionSetPrice")}
        </button>
      </section>
    );
  }

  if (editing) {
    const editContent = (
      <>
        <h2 className={isCard ? styles.cardSectionTitle : styles.title}>
          {t("subscriptionPriceTitle")}
        </h2>
        <label className={styles.priceLabel}>
          {t("onboardingPriceLabel")}
          <input
            type="number"
            min={1}
            step={1}
            className={isCard ? styles.priceInputCard : styles.priceInput}
            value={priceRub}
            onChange={(e) => {
              setPriceRub(e.target.value);
              setError(null);
            }}
            autoFocus
          />
        </label>
        {usdEquivalent != null && (
          <p className={styles.conversion}>
            {t("onboardingPriceConversion", { usd: formatUsd(usdEquivalent) })}
          </p>
        )}
        <p className={styles.recommended}>
          {t("onboardingPriceRecommended", {
            minUsd: formatUsd(RECOMMENDED_USD_MIN),
            maxUsd: formatUsd(RECOMMENDED_USD_MAX),
            minRub: formatRub(usdToRub(RECOMMENDED_USD_MIN)),
            maxRub: formatRub(usdToRub(RECOMMENDED_USD_MAX)),
          })}
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t("saving") : t("save")}
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={saving}
          >
            {t("cancel")}
          </button>
        </div>
      </>
    );

    return (
      <section
        className={isCard ? styles.cardSection : styles.wrap}
        aria-label={t("subscriptionPriceTitle")}
      >
        {isCard ? <div className={styles.editCard}>{editContent}</div> : editContent}
      </section>
    );
  }

  if (isCard) {
    return (
      <section className={styles.cardSection} aria-label={t("subscriptionPriceTitle")}>
        <h2 className={styles.cardSectionTitle}>{t("subscriptionPriceTitle")}</h2>
        <div className={styles.cardRows}>
          <div className={styles.infoRow}>
            <span className={styles.iconCircle}>
              <PriceIcon />
            </span>
            <span className={styles.rowContent}>
              <span className={styles.rowLabel}>{t("subscriptionPriceRub")}</span>
              <span className={styles.rowValue}>
                {formatRub(influencer.subscription_price_rub!)}
              </span>
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={`${styles.iconCircle} ${styles.iconCircleMuted}`}>
              <span className={styles.usdBadge}>$</span>
            </span>
            <span className={styles.rowContent}>
              <span className={styles.rowLabel}>{t("subscriptionPriceUsd")}</span>
              <span className={styles.rowValue}>
                {formatUsd(rubToUsd(influencer.subscription_price_rub!))}
              </span>
            </span>
          </div>
        </div>
        <button
          type="button"
          className={styles.editBtnCard}
          onClick={() => {
            setPriceRub(influencer.subscription_price_rub?.toString() ?? "");
            setEditing(true);
          }}
        >
          {t("edit")}
        </button>
      </section>
    );
  }

  return (
    <section className={styles.wrap} aria-label={t("subscriptionPriceTitle")}>
      <h2 className={styles.title}>{t("subscriptionPriceTitle")}</h2>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>{t("subscriptionPriceRub")}</dt>
          <dd>{formatRub(influencer.subscription_price_rub!)}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t("subscriptionPriceUsd")}</dt>
          <dd>{formatUsd(rubToUsd(influencer.subscription_price_rub!))}</dd>
        </div>
      </dl>
      <button
        type="button"
        className={styles.editBtn}
        onClick={() => {
          setPriceRub(influencer.subscription_price_rub?.toString() ?? "");
          setEditing(true);
        }}
      >
        {t("edit")}
      </button>
    </section>
  );
}
