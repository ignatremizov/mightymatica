import { useEffect, useRef, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl, t } from "../../shared/contracts";
import films from "../../content/films.json";

export default function Films(props: ActivityProps) {
  const film = films.find(item => `films-${item.key.toLowerCase()}` === props.activityId);
  if (!film) return <p>{t(props.locale, "Film not found.", "Фильм не найден.")}</p>;
  return <FilmPlayer key={film.key} film={film} locale={props.locale} />;
}

function FilmPlayer({ film, locale }: { film: typeof films[number]; locale: ActivityProps["locale"] }) {
  const video = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const player = video.current;
    // Initialize once; native volume controls must not feed back into a
    // controlled muted prop when volume reaches zero.
    if (player) player.muted = true;
    return () => {
      player?.pause();
    };
  }, []);
  const replay = async () => {
    if (!video.current) return;
    video.current.currentTime = 0;
    try { await video.current.play(); } catch { setError(true); }
  };
  return <section className="activity-layout" aria-label={film.title}>
    <video ref={video} src={mediaUrl(film.src)} controls playsInline preload="metadata"
      aria-label={film.title} onError={() => setError(true)}
      onPlaying={() => setError(false)}
      onVolumeChange={() => {
        const player = video.current;
        if (player) setSound(!player.muted && player.volume > 0);
      }}
      style={{ display: "block", width: "100%", maxWidth: "width" in film ? film.width : 640, maxHeight: "75vh", marginInline: "auto" }}>
      {t(locale, "Your browser does not support this video.", "Ваш браузер не поддерживает это видео.")}
    </video>
    <div className="controls">
      <button className="button" onClick={() => void replay()}>{t(locale, "Replay", "Смотреть сначала")}</button>
      {film.audio && <label className="control">
        <input type="checkbox" checked={sound} onChange={event => {
          const player = video.current;
          if (!player) return;
          const enabled = event.target.checked;
          player.muted = !enabled;
          if (enabled && player.volume === 0) player.volume = 1;
          setSound(enabled);
        }} />
        {t(locale, "Enable original soundtrack", "Включить оригинальную звуковую дорожку")}
      </label>}
    </div>
    {error && <p role="alert">{t(locale, "Playback failed. Try the video controls again or open the film directly.", "Не удалось воспроизвести фильм. Попробуйте снова или откройте видео отдельно.")} <a href={mediaUrl(film.src)}>{t(locale, "Open film", "Открыть фильм")}</a></p>}
  </section>;
}
