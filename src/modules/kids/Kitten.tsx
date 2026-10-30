import { useEffect, useRef } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl, t } from "../../shared/contracts";

export default function Kitten({ locale, reducedMotion }: ActivityProps) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    return () => {
      video.current?.pause();
    };
  }, []);
  useEffect(() => { if (reducedMotion) video.current?.pause(); }, [reducedMotion]);
  return <section className="activity-layout kids-original">
    <p className="explanation">{t(locale,
      "Watch the original kitten scene. Press Play when you are ready; pause or scrub to examine any moment. Sound starts muted and can be enabled with the player controls.",
      "Посмотри исходную сценку с котёнком. Нажми «Воспроизвести», когда будешь готов; можно остановиться и рассмотреть любой момент. Звук сначала выключен — его можно включить в плеере.")}</p>
    <video ref={video} className="kids-kitten" controls muted playsInline preload="none"
      poster={mediaUrl("kids/kitten/1.png")} aria-label={t(locale, "Original animated Kitten scene", "Исходная анимация «Котёнок»")}>
      <source src={mediaUrl("kids/kitten/kitten.mp4")} type="video/mp4" />
      {t(locale, "Your browser cannot play this video.", "Браузер не может воспроизвести это видео.")}
    </video>
    <p className="activity-note">{t(locale,
      "Playback pauses when you leave this tab. Use the player controls to watch again.",
      "При скрытии вкладки воспроизведение останавливается. Чтобы посмотреть ещё раз, воспользуйся кнопками плеера.")}</p>
  </section>;
}
