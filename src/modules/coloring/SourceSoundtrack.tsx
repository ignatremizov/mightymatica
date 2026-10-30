import { useEffect, useRef, useState } from "react";
import { t, type Locale } from "../../shared/contracts";
import { LessonAudio } from "../../shared/LessonAudio";
import { useAnimation } from "../../shared/useAnimation";
import hexEn from "./audio-Recthexprizm-colorproblem.json";
import hexRu from "./audio-Recthexprizm-colorproblem-ru.json";
import tetraEn from "./audio-Tetra-colorproblem.json";
import tetraRu from "./audio-Tetra-colorproblem-ru.json";
import brickEn from "./audio-brick-colorproblem.json";
import brickRu from "./audio-brick-colorproblem-ru.json";
import prismEn from "./audio-paralele-colorproblem.json";
import prismRu from "./audio-paralele-colorproblem-ru.json";

const tracks = {
  "coloring-hexagonal-prism": { en: hexEn, ru: hexRu },
  "coloring-tetrahedron": { en: tetraEn, ru: tetraRu },
  "coloring-brick": { en: brickEn, ru: brickRu },
  "coloring-right-prism": { en: prismEn, ru: prismRu },
};
/** The one-frame source solids have a soundtrack, not a narrated timeline. */
export default function SourceSoundtrack({ activityId, locale }: { activityId: string; locale: Locale }) {
  const player = useRef<LessonAudio | null>(null);
  const elapsed = useRef(0);
  const request = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = Object.hasOwn(tracks, activityId) ? tracks[activityId as keyof typeof tracks][locale] : null;
  useEffect(() => {
    if (!source) return;
    const audio = new LessonAudio({
      width: source.width, height: source.height, fps: source.fps,
      initialFrame: 1, endFrame: 1, chapters: [], stops: [],
      audioCues: source.audioCues,
      audioAssets: source.audioAssets.map(asset => {
        if (asset.durationSeconds === null) throw new Error("Missing source soundtrack duration");
        return { ...asset, durationSeconds: asset.durationSeconds };
      }),
    }, () => setFailed(true));
    player.current = audio;
    audio.reset(1);
    elapsed.current = 0;
    setPlaying(false);
    setLoading(false);
    setFailed(false);
    return () => {
      request.current++;
      audio.dispose();
      if (player.current === audio) player.current = null;
    };
  }, [source]);
  useAnimation(delta => {
    elapsed.current += delta;
    player.current?.sync(elapsed.current, true);
    if (!player.current?.activeCount) setPlaying(false);
  }, playing && !loading, { preserveElapsed: true });
  if (!source) return null;
  const play = () => {
    const audio = player.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); return; }
    if (!audio.activeCount) { elapsed.current = 0; audio.reset(1); }
    const generation = ++request.current;
    setFailed(false);
    setLoading(true);
    audio.retry();
    void audio.activate().then(() => audio.prepareRange(1, 1)).then(() => {
      if (player.current !== audio || request.current !== generation) return;
      setLoading(false);
      setPlaying(true);
    }).catch(() => { if (player.current === audio && request.current === generation) { setLoading(false); setFailed(true); } });
  };
  return <div className="coloring-soundtrack" role="group" aria-label={t(locale, "Original soundtrack", "Оригинальная звуковая дорожка")}>
    <span>{t(locale, "Original soundtrack", "Оригинальная звуковая дорожка")}</span>
    <button className="button button-secondary" onClick={play} disabled={loading}>
      {t(locale, loading ? "Loading…" : playing ? "Pause" : "Play", loading ? "Загрузка…" : playing ? "Пауза" : "Воспроизвести")}
    </button>
    <button className="button button-secondary" onClick={() => {
      request.current++; player.current?.pause(); player.current?.reset(1);
      elapsed.current = 0; setPlaying(false); setLoading(false);
    }}>{t(locale, "Restart sound", "Звук сначала")}</button>
    {failed && <span role="status">{t(locale, "Sound could not be loaded. Try Play again.", "Не удалось загрузить звук. Нажмите «Воспроизвести» ещё раз.")}</span>}
  </div>;
}
