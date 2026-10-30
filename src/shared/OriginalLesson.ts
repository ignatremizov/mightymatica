/** Source frames are global and one-based, including across authored scenes. */
export interface LessonStop {
  frame: number;
  /** Validated at the media boundary; imported JSON uses ordinary strings. */
  kind: string;
  delayMs?: number;
}

export interface LessonSound {
  soundId: number;
  src: string;
  durationSeconds: number;
  sampleRate: number;
  sampleCount: number;
  seekSamples?: number;
}

export interface LessonSoundCue {
  frame: number;
  soundId: number;
  inPoint44: number;
  outPoint44: number | null;
  loops: number;
  sync: string;
  envelope: readonly { mark44: number; left: number; right: number }[];
}

export interface OriginalLessonDefinition {
  width: number;
  height: number;
  fps: number;
  initialFrame: number;
  endFrame: number;
  chapters: readonly { id: string; startFrame: number; endFrame: number; module: string }[];
  stops: readonly LessonStop[];
  audioAssets: readonly LessonSound[];
  audioCues: readonly LessonSoundCue[];
}

export interface LessonClock {
  frame: number;
  /** Active presentation time; event sounds keep advancing at authored stops. */
  elapsed: number;
  frameElapsed: number;
  untilNextFrame: number;
  hold: number;
  waiting: LessonStop | null;
  complete: boolean;
}

export function validateOriginalLesson(lesson: OriginalLessonDefinition): void {
  const integer = (n: number) => Number.isSafeInteger(n);
  if (!integer(lesson.width) || !integer(lesson.height)
    || lesson.width < 1 || lesson.height < 1 || lesson.width > 2048 || lesson.height > 2048
    || !Number.isFinite(lesson.fps) || lesson.fps <= 0 || lesson.fps > 60
    || !integer(lesson.initialFrame) || !integer(lesson.endFrame)
    || lesson.initialFrame < 1 || lesson.endFrame < lesson.initialFrame || lesson.endFrame > 65535
    || !lesson.chapters.length || lesson.chapters.length > 64
    || lesson.stops.length > 1024 || lesson.audioCues.length > 4096 || lesson.audioAssets.length > 512) {
    throw new Error("Invalid native lesson bounds.");
  }
  let previousEnd = lesson.chapters[0]!.startFrame - 1;
  for (const chapter of lesson.chapters) {
    if (!integer(chapter.startFrame) || !integer(chapter.endFrame)
      || chapter.startFrame !== previousEnd + 1 || chapter.endFrame < chapter.startFrame
      || chapter.endFrame - chapter.startFrame >= 5000) throw new Error("Invalid lesson chapters.");
    previousEnd = chapter.endFrame;
  }
  if (lesson.chapters[0]!.startFrame > lesson.initialFrame || previousEnd < lesson.endFrame) {
    throw new Error("Lesson frames are not fully covered.");
  }
  let stopFrame = 0;
  for (const stop of lesson.stops) {
    if (!integer(stop.frame) || stop.frame <= stopFrame || stop.frame > lesson.endFrame
      || !["manual", "timed", "complete"].includes(stop.kind)
      || (stop.kind === "timed" && (!Number.isFinite(stop.delayMs) || stop.delayMs! < 0 || stop.delayMs! > 60000))) {
      throw new Error("Invalid lesson stop.");
    }
    stopFrame = stop.frame;
  }
  const sounds = new Set<number>();
  for (const sound of lesson.audioAssets) {
    if (!integer(sound.soundId) || sounds.has(sound.soundId)
      || !Number.isFinite(sound.durationSeconds) || sound.durationSeconds <= 0 || sound.durationSeconds > 3600
      || !Number.isFinite(sound.sampleRate) || sound.sampleRate <= 0
      || !Number.isFinite(sound.sampleCount) || sound.sampleCount <= 0
      || !Number.isFinite(sound.seekSamples ?? 0)) throw new Error("Invalid lesson sound.");
    sounds.add(sound.soundId);
  }
  let cueFrame = 0;
  for (const cue of lesson.audioCues) {
    if (!integer(cue.frame) || cue.frame < cueFrame || cue.frame > lesson.endFrame || cue.frame < 1
      || !sounds.has(cue.soundId) || !["event", "start", "stop"].includes(cue.sync)
      || !integer(cue.loops) || cue.loops < 1 || cue.loops > 100
      || !integer(cue.inPoint44) || cue.inPoint44 < 0
      || (cue.outPoint44 !== null && (!integer(cue.outPoint44) || cue.outPoint44 <= cue.inPoint44))
      || cue.envelope.length > 4096) throw new Error("Invalid lesson sound cue.");
    for (const point of cue.envelope) {
      if (!integer(point.mark44) || point.mark44 < 0
        || !Number.isFinite(point.left) || !Number.isFinite(point.right)
        || point.left < 0 || point.right < 0 || point.left > 32768 || point.right > 32768) {
        throw new Error("Invalid lesson sound envelope.");
      }
    }
    cueFrame = cue.frame;
  }
}

export function createLessonClock(lesson: OriginalLessonDefinition): LessonClock {
  return {
    frame: lesson.initialFrame,
    elapsed: 0,
    frameElapsed: 0,
    untilNextFrame: 1 / lesson.fps,
    hold: 0,
    waiting: lesson.stops.find(stop => stop.frame === lesson.initialFrame && stop.kind === "manual") ?? null,
    complete: lesson.initialFrame === lesson.endFrame,
  };
}

/** Finite branches cannot replay skipped wrong-answer sounds or seek past a gate. */
export function lessonSegment(
  lesson: OriginalLessonDefinition,
  initialFrame: number,
  endFrame: number,
  stops: readonly LessonStop[] = lesson.stops,
): OriginalLessonDefinition {
  return {
    ...lesson, initialFrame, endFrame,
    chapters: lesson.chapters.filter(chapter => chapter.startFrame <= endFrame && chapter.endFrame >= initialFrame)
      .map(chapter => ({ ...chapter, startFrame: Math.max(initialFrame, chapter.startFrame),
        endFrame: Math.min(endFrame, chapter.endFrame) })),
    stops: [...stops.filter(stop => stop.frame >= initialFrame && stop.frame < endFrame),
      { frame: endFrame, kind: "complete" }],
    audioCues: lesson.audioCues.filter(cue => cue.frame >= initialFrame && cue.frame <= endFrame),
  };
}

export function enterLessonFrame(
  clock: LessonClock,
  frame: number,
  lesson: OriginalLessonDefinition,
  visit: (frame: number, elapsed: number) => void,
): void {
  clock.frame = frame;
  clock.frameElapsed = 0;
  clock.untilNextFrame = 1 / lesson.fps;
  visit(frame, clock.elapsed);
  const stop = lesson.stops.find(entry => entry.frame === frame);
  if (frame >= lesson.endFrame || stop?.kind === "complete") clock.complete = true;
  else if (stop?.kind === "timed") clock.hold = stop.delayMs! / 1000;
  else if (stop?.kind === "manual") clock.waiting = stop;
}

/**
 * The caller invokes this only while transport is playing.
 * Consume its real elapsed time, including slow drawing frames. Work remains
 * bounded by the finite chapter; manual gates and chapter loads cannot be
 * skipped, and a hold/wait consumes the remaining time without frame stepping.
 */
export function advanceLessonClock(
  clock: LessonClock,
  seconds: number,
  lesson: OriginalLessonDefinition,
  chapterEnd: number,
  visit: (frame: number, elapsed: number) => void,
): void {
  let remaining = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  while (remaining > 1e-9) {
    if (clock.waiting || clock.complete) {
      clock.elapsed += remaining;
      clock.frameElapsed += remaining;
      return;
    }
    if (clock.hold > 0) {
      const step = Math.min(remaining, clock.hold);
      clock.hold -= step;
      clock.elapsed += step;
      clock.frameElapsed += step;
      remaining -= step;
      continue;
    }
    const step = Math.min(remaining, clock.untilNextFrame);
    clock.untilNextFrame -= step;
    clock.elapsed += step;
    clock.frameElapsed += step;
    remaining -= step;
    if (clock.untilNextFrame > 1e-9) continue;
    // A chapter boundary loads the next native drawing module before more
    // presentation time or sound events are consumed.
    if (clock.frame >= chapterEnd && chapterEnd < lesson.endFrame) return;
    enterLessonFrame(clock, clock.frame + 1, lesson, visit);
  }
}

/** Gain is source-relative, not relative to the cropped playback window. */
export function lessonEnvelopeGain(cue: LessonSoundCue, sourceSeconds: number, channel: "left" | "right"): number {
  const points = cue.envelope;
  if (!points.length) return 1;
  const sample = sourceSeconds * 44100;
  if (sample <= points[0]!.mark44) return points[0]![channel] / 32768;
  let leftMark = points[0]!.mark44;
  for (let i = 1; i < points.length; i++) {
    const right = points[i]!;
    // A few authored envelopes put the final zero-gain mark milliseconds
    // before its predecessor. Preserve point order and the intended final
    // fade instead of sorting the zero before a later full-volume point.
    const rightMark = Math.max(leftMark, right.mark44);
    if (sample <= rightMark) {
      const left = points[i - 1]!;
      const fraction = (sample - leftMark) / Math.max(1, rightMark - leftMark);
      return (left[channel] + fraction * (right[channel] - left[channel])) / 32768;
    }
    leftMark = rightMark;
  }
  return points[points.length - 1]![channel] / 32768;
}
