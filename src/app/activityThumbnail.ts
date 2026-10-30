import type { ActivityMeta, Locale } from "../shared/contracts";

// These originals use an unsuffixed Russian filename, not an English default.
// Verified against the bilingual links in the preserved Visualmath.html and
// Visualmath-n[-ru].html pages.
const russianSources = new Set([
  "Movies/Coinsrotate.swf",
  "Movies/Coinsrotate-2c.swf",
  "Movies/Cubeflash-white.swf",
  "Movies/Twocolorplane.swf",
  "Movies/Snail.swf",
  "Movies/Staruhi.swf",
]);

function sourceLocale(source: string, sources: readonly string[]): Locale | undefined {
  if (russianSources.has(source) || /-ru(?:-mod)?\.swf$/i.test(source)) return "ru";
  if (/-(?:e|en|eng)\.swf$/i.test(source)) return "en";
  // Only infer an unsuffixed English original when its Russian partner exists.
  const stem = source.replace(/\.swf$/i, "").trim();
  if (sources.some((candidate) =>
    candidate.replace(/(?:\s*-ru(?:-mod)?)?\.swf$/i, "").trim() === stem
    && /-ru(?:-mod)?\.swf$/i.test(candidate))) return "en";
  return undefined;
}

/** Choose preserved language artwork without changing authored page illustrations. */
export function activityThumbnail(
  activity: Pick<ActivityMeta, "sources" | "thumbnail">,
  locale: Locale,
  previews: Readonly<Record<string, string>>,
): string | undefined {
  // Explicit covers and code-native previews are intentional, often language-neutral.
  if (activity.thumbnail) return activity.thumbnail;
  const localized = activity.sources.find((source) =>
    previews[source] && sourceLocale(source, activity.sources) === locale);
  return localized ? previews[localized] : activity.sources.map((source) => previews[source]).find(Boolean);
}
