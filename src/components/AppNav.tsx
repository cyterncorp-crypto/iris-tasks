"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import LocaleToggle from "./LocaleToggle";
import styles from "./AppNav.module.css";

export default function AppNav() {
  const pathname = usePathname();
  const { t } = useT();

  const isHome = pathname === "/";
  const isInfluencers =
    pathname === "/influenciadores" || pathname.startsWith("/influenciadores/");

  return (
    <nav className={styles.nav}>
      <Link
        href="/"
        className={`${styles.link} ${isHome ? styles.active : ""}`}
      >
        {t("home")}
      </Link>
      <Link
        href="/influenciadores"
        className={`${styles.link} ${isInfluencers ? styles.active : ""}`}
      >
        {t("influencers")}
      </Link>
      <div className={styles.localeToggle}>
        <LocaleToggle />
      </div>
    </nav>
  );
}
