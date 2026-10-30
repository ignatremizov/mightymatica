import { useEffect, useRef, useState } from "react";
import type { Locale } from "../../shared/contracts";
import { t } from "../../shared/contracts";

interface StoryFilmProps {
  src: string;
  locale: Locale;
  title: string;
  description: string;
  audio: boolean;
  onContinue: () => void;
}

/** Original companion movie, with playback owned by the mounted activity. */
export function StoryFilm({ src, locale, title, description, audio, onContinue }: StoryFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      video?.pause();
    };
  }, []);

  async function play(restart = false) {
    const video = videoRef.current;
    if (!video) return;
    if (restart) video.currentTime = 0;
    setEnded(false);
    setError("");
    try {
      await video.play();
    } catch {
      setError(t(locale, "Playback could not start. Try Play again, or continue to the picture.", "Не удалось начать просмотр. Нажмите «Смотреть» ещё раз или перейдите к картинке."));
    }
  }

  return <section className="stories-film" aria-label={title}>
    <h2>{title}</h2>
    <p>{description}</p>
    <video ref={videoRef} src={src} playsInline preload="metadata" muted={!sound}
      controls aria-label={title}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => { setPlaying(false); setEnded(true); }}
      onVolumeChange={() => {
        const video = videoRef.current;
        if (video) setSound(!video.muted && video.volume > 0);
      }}
      onError={() => setError(t(locale, "This movie could not be loaded. You can still continue to the picture.", "Не удалось загрузить мультфильм. Можно перейти к картинке."))}
    />
    <div className="controls">
      <button type="button" className="button" onClick={() => {
        if (playing) videoRef.current?.pause();
        else void play(ended);
      }}>{playing ? t(locale, "Pause", "Пауза") : t(locale, "Play", "Смотреть")}</button>
      <button type="button" className="button button-secondary" onClick={() => { void play(true); }}>
        {t(locale, "Replay from start", "Смотреть сначала")}
      </button>
      <button type="button" className="button button-secondary" disabled={!audio} aria-pressed={sound} onClick={() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = sound;
        if (!sound && video.volume === 0) video.volume = 1;
        setSound(!sound);
      }}>{sound ? t(locale, "Mute sound", "Выключить звук") : t(locale, "Enable sound", "Включить звук")}</button>
      <button type="button" className="button button-secondary" onClick={() => {
        videoRef.current?.pause();
        onContinue();
      }}>{t(locale, "Continue to picture", "Перейти к картинке")}</button>
    </div>
    {!audio && <p className="activity-note">{t(locale, "No audio track.", "Без звуковой дорожки.")}</p>}
    <p className="activity-status" role="status">{error || (ended
      ? t(locale, "Movie finished. Replay it or continue to the picture.", "Мультфильм закончился. Посмотрите ещё раз или перейдите к картинке.")
      : playing ? t(locale, "Playing", "Идёт просмотр")
        : sound ? t(locale, "Paused. Sound enabled.", "На паузе. Звук включён.")
          : t(locale, "Paused. Sound is off until you enable it.", "На паузе. Звук выключен, пока вы его не включите."))}</p>
  </section>;
}
