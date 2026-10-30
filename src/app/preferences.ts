import { useEffect, useState } from "react";
import type { Locale } from "../shared/contracts";

interface Preferences {
  locale: Locale;
  motion: "system" | "reduced";
}

const KEY = "mightymatica.preferences.v1";

function read(): Preferences {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return {
      locale: raw?.locale === "ru" ? "ru" : "en",
      motion: raw?.motion === "reduced" ? "reduced" : "system",
    };
  } catch {
    return { locale: "en", motion: "system" };
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState(read);
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    document.documentElement.lang = preferences.locale;
    try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch { /* Storage is optional. */ }
  }, [preferences]);
  return {
    ...preferences,
    reducedMotion: systemReduced || preferences.motion === "reduced",
    // Lessons honor the device preference, independently of decorative page art.
    activityReducedMotion: systemReduced,
    setLocale: (locale: Locale) => setPreferences((value) => ({ ...value, locale })),
    setMotion: (motion: Preferences["motion"]) => setPreferences((value) => ({ ...value, motion })),
  };
}
