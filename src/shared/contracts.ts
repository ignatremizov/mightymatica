export type Locale = "en" | "ru";

export type CategoryId =
  | "geometry"
  | "visual-math"
  | "puzzles"
  | "magic"
  | "kids"
  | "spatial"
  | "calculus"
  | "books";

export interface ActivityMeta {
  /** Globally unique bookmarkable ID. */
  id: string;
  title: string;
  titleRu?: string;
  description: string;
  descriptionRu?: string;
  category: CategoryId;
  /** Exact original paths such as "Movies/Mindread.swf". */
  sources: string[];
  /** An adaptation preserves the idea, without claiming timeline equivalence. */
  fidelity: "native" | "adaptation" | "reader";
  /** Optional asset URL relative to public/media/, without a leading slash. */
  thumbnail?: string;
}

export interface ActivityProps {
  activityId: string;
  locale: Locale;
  reducedMotion: boolean;
  /** Compact presentation within an original page's authored illustration slot. */
  embedded?: boolean;
  /** Suspend decorative playback outside its visible authored page slot. */
  active?: boolean;
}

export function t(locale: Locale, english: string, russian?: string): string {
  return locale === "ru" && russian ? russian : english;
}

export function mediaUrl(path: string): string {
  return `${import.meta.env.BASE_URL}media/${path.split("/").map(encodeURIComponent).join("/")}`;
}
