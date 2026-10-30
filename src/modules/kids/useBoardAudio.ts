import { useEffect, useMemo, useRef, useState } from "react";
import { LessonAudio } from "../../shared/LessonAudio";
import type { LessonSoundCue, OriginalLessonDefinition } from "../../shared/OriginalLesson";
import { useAnimation } from "../../shared/useAnimation";
import audio from "./audio.json";
import stages from "./lesson-stages.json";

interface ButtonCue extends Omit<LessonSoundCue, "frame"> { pictureId: string }
const sourceAudio = audio as Record<string, Pick<OriginalLessonDefinition, "width" | "height" | "fps" | "audioAssets">>;
const sourceStages = stages as Record<string, { stages: { buttonCues: ButtonCue[] }[] }>;

/** Input-event addresses are local to this adapter, never source root frames. */
export function useBoardAudio(activityId: string, stageIndex: number) {
  const [enabled, setEnabled] = useState(true);
  const [failed, setFailed] = useState(false);
  const owner = useRef<LessonAudio | null>(null);
  const time = useRef(0);
  const generation = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const events = useMemo(() => {
    if (activityId === "kids-find-proper") {
      return sourceStages[activityId]!.stages[stageIndex]!.buttonCues
        .map((cue, index) => ({ key: cue.pictureId, ...cue, frame: index + 1 }));
    }
    if (activityId === "kids-find-connect" || activityId === "kids-find-match") return [];
    const gain = activityId === "kids-find-improper" ? .2 : activityId === "kids-find-couple" ? .4 : 1;
    return ["correct", "wrong"].map((key, index) => ({
      key, frame: index + 1,
      soundId: key === "correct" || activityId === "kids-find-couple" ? 90001 : 90002,
      inPoint44: 0, outPoint44: null, loops: 1, sync: "event",
      envelope: [{ mark44: 0, left: Math.round(gain * 32768), right: Math.round(gain * 32768) }],
    }));
  }, [activityId, stageIndex]);
  useEffect(() => {
    const instance = new LessonAudio({
      ...sourceAudio[activityId]!, initialFrame: 1, endFrame: Math.max(1, events.length),
      chapters: [], stops: [], audioCues: events,
    }, () => setFailed(true));
    owner.current = instance;
    time.current = 0;
    return () => { instance.dispose(); if (owner.current === instance) owner.current = null; };
  }, [activityId, events]);
  useAnimation(delta => {
    time.current += delta;
    owner.current?.sync(time.current, enabled);
  }, enabled, { preserveElapsed: true });
  function play(key: string) {
    const instance = owner.current;
    const event = events.find(item => item.key === key);
    if (!instance || !event || !enabledRef.current) return;
    const requestGeneration = generation.current;
    void instance.activate().then(() => instance.prepareRange(event.frame, event.frame)).then(() => {
      if (owner.current !== instance || requestGeneration !== generation.current
        || !enabledRef.current) return;
      if (instance.activeCount >= 16) instance.stopAll();
      instance.visit(event.frame, time.current);
      instance.sync(time.current, true);
    }).catch(() => { if (owner.current === instance) setFailed(true); });
  }
  function toggle(value: boolean) {
    generation.current++;
    setEnabled(value);
    enabledRef.current = value;
    if (!value) owner.current?.stopAll();
  }
  return { enabled, toggle, play, failed, available: events.length > 0 };
}
