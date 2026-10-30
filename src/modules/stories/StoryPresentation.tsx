import { useMemo } from "react";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import { t, type Locale } from "../../shared/contracts";
import pinocchio from "./audio-Pinoc-game.json";
import prostokvashino from "./audio-Prosto-game.json";
import snowWhite from "./audio-Snowhite-game.json";
import { storyPresentation } from "./presentation";

const recovered = { "Pinoc-game": pinocchio, "Prosto-game": prostokvashino, "Snowhite-game": snowWhite };

export default function StoryPresentation({ source, victory, locale, reducedMotion }: {
  source: string; victory: boolean; locale: Locale; reducedMotion: boolean;
}) {
  const lesson = useMemo(() => storyPresentation(
    source, victory, recovered[source as keyof typeof recovered],
  ), [source, victory]);
  return <OriginalLessonPlayer lesson={lesson} locale={locale} reducedMotion={reducedMotion}
    initialSound={false}
    label={victory
      ? t(locale, "Picture complete", "Картинка собрана")
      : t(locale, "Original picture introduction", "Оригинальная заставка картинки")} />;
}
