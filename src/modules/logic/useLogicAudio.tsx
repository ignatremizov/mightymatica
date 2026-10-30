import { useEffect, useRef, useState } from "react";
import { mediaUrl, t, type Locale } from "../../shared/contracts";

export type LogicClip = "Howmany.mp3" | "Shortbang.mp3" | "AngryMob.mp3" | "Mystery.mp3" | "Kidsmelody.mp3" | "salut.MP3"
  | "Completechain-18.mp3" | "Completechain-80.mp3"
  | "Necklace-75.mp3" | "Necklace-79.mp3" | "Necklace-80.mp3" | "Necklace-87.mp3"
  | "Rippednecklace-56.mp3" | "Rippednecklace-62.mp3" | "Rippednecklace-63.mp3"
  | "Stones-78.mp3" | "Stones-79.mp3" | "Stones-185.mp3";

/** Original prompt/events only; no narration is inferred or synthesized. */
export function useLogicAudio(locale: Locale, intro?: LogicClip, hasMusic = false) {
  const clips = useRef(new Map<LogicClip, HTMLAudioElement>());
  const enabled = useRef(true);
  const mounted = useRef(false);
  const [sound, setSound] = useState(true);
  const [error, setError] = useState(false);
  const [music, setMusic] = useState(false);
  function stop() {
    for (const clip of clips.current.values()) { clip.pause(); clip.currentTime = 0; }
    setMusic(false);
  }
  useEffect(() => {
    mounted.current = true;
    const owned = clips.current;
    return () => {
      mounted.current = false;
      for (const clip of owned.values()) { clip.pause(); clip.onended = null; clip.removeAttribute("src"); clip.load(); }
      owned.clear();
    };
  }, []);
  function play(name: LogicClip) {
    if (!enabled.current) return;
    let clip = clips.current.get(name);
    if (!clip) {
      clip = new Audio(mediaUrl(`logic/native/effects/${name}`));
      clip.preload = "none";
      clip.volume = name === "Kidsmelody.mp3" ? .07 : .4;
      if (name === "Kidsmelody.mp3") clip.onended = () => { if (mounted.current) setMusic(false); };
      clips.current.set(name, clip);
    }
    clip.currentTime = 0;
    void clip.play().catch(() => { if (mounted.current && enabled.current) setError(true); });
  }
  const control = <span className="controls">
    <label><input type="checkbox" checked={sound} onChange={(event) => {
      enabled.current = event.currentTarget.checked;
      setSound(enabled.current);
      setError(false);
      if (!enabled.current) { stop(); setMusic(false); }
      else if (intro) play(intro);
    }} /> {t(locale, "Sound", "Звук")}</label>
    {hasMusic && <button type="button" className="button button-secondary" disabled={!sound} aria-pressed={music} onClick={() => {
      if (music) clips.current.get("Kidsmelody.mp3")?.pause();
      else play("Kidsmelody.mp3");
      setMusic(!music);
    }}>{t(locale, music ? "Pause music" : "Play music", music ? "Пауза музыки" : "Включить музыку")}</button>}
    {error && <span role="status">{t(locale, "Sound is unavailable. You can keep playing.", "Звук недоступен. Можно продолжить игру.")}</span>}
  </span>;
  return { play, stop, control };
}
