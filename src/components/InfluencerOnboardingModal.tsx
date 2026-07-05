"use client";

import { useState } from "react";
import type { Influencer } from "@/lib/types";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  formatRub,
  formatUsd,
  RECOMMENDED_USD_MAX,
  RECOMMENDED_USD_MIN,
  rubToUsd,
  usdToRub,
} from "@/lib/rub-usd";
import styles from "./InfluencerOnboardingModal.module.css";

const TOTAL_STEPS = 4;

interface Props {
  influencer: Influencer;
  onComplete: (priceRub: number) => Promise<void>;
  onDismiss: () => void;
}

export default function InfluencerOnboardingModal({
  influencer,
  onComplete,
  onDismiss,
}: Props) {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [priceRub, setPriceRub] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedPrice = parseInt(priceRub.replace(/\s/g, ""), 10);
  const priceValid = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const usdEquivalent = priceValid ? rubToUsd(parsedPrice) : null;
  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100;

  async function handleFinish() {
    if (!priceValid) {
      setError(t("onboardingPriceRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onComplete(parsedPrice);
    } catch {
      setError(t("errorSave"));
      setSaving(false);
    }
  }

  function handleConfirmPrice() {
    if (!priceValid) {
      setError(t("onboardingPriceRequired"));
      return;
    }
    setError(null);
    setStep(2);
  }

  function handleSkip() {
    setError(null);
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      onDismiss();
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <div className={styles.formProgress}>
          <div className={styles.formProgressTrack}>
            <div
              className={styles.formProgressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className={styles.formProgressLabel}>
            {t("onboardingStepOf", { current: step + 1, total: TOTAL_STEPS })}
          </span>
        </div>

        {step === 0 && (
          <div className={styles.step}>
            <p className={styles.welcomeText}>
              {t("onboardingWelcome", { name: influencer.name })}
            </p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setStep(1)}
            >
              {t("onboardingContinue")}
            </button>
            <button type="button" className={styles.skipBtn} onClick={handleSkip}>
              {t("onboardingSkip")}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className={styles.step}>
            <p className={styles.questionText}>{t("onboardingPriceQuestion")}</p>
            <label className={styles.priceLabel}>
              {t("onboardingPriceLabel")}
              <input
                type="number"
                min={1}
                step={1}
                className={styles.priceInput}
                value={priceRub}
                onChange={(e) => {
                  setPriceRub(e.target.value);
                  setError(null);
                }}
                placeholder="990"
                autoFocus
              />
            </label>
            {usdEquivalent != null && (
              <p className={styles.conversion}>
                {t("onboardingPriceConversion", {
                  usd: formatUsd(usdEquivalent),
                })}
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
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleConfirmPrice}
            >
              {t("onboardingConfirm")}
            </button>
            <button type="button" className={styles.skipBtn} onClick={handleSkip}>
              {t("onboardingSkip")}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <p className={styles.questionText}>{t("onboardingProgressExplain")}</p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setStep(3)}
            >
              {t("onboardingUnderstand")}
            </button>
            <button type="button" className={styles.skipBtn} onClick={handleSkip}>
              {t("onboardingSkip")}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <p className={styles.questionText}>{t("onboardingTasksExplain")}</p>
            {error && <p className={styles.error}>{error}</p>}
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? t("saving") : t("onboardingFinish")}
            </button>
            <button
              type="button"
              className={styles.skipBtn}
              onClick={handleSkip}
              disabled={saving}
            >
              {t("onboardingSkip")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
