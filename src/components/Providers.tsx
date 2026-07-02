"use client";

import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}
