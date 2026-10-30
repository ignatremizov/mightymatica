import { mediaUrl } from "./contracts";
import { lessonEnvelopeGain } from "./OriginalLesson";
import type { LessonSound, LessonSoundCue, OriginalLessonDefinition } from "./OriginalLesson";

type LessonAudioDefinition = Pick<OriginalLessonDefinition, "fps" | "stops" | "audioAssets" | "audioCues">
  & Partial<OriginalLessonDefinition>;

export function lessonMediaUrl(path: string, extension: string): string {
  const base = new URL(`${import.meta.env.BASE_URL}media/`, document.baseURI);
  const url = new URL(mediaUrl(path), document.baseURI);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)
    || !url.pathname.endsWith(extension) || url.search || url.hash) {
    throw new Error("Expected reviewed local lesson media.");
  }
  return url.href;
}

interface PlayingCue {
  cue: LessonSoundCue;
  at: number;
  node?: AudioBufferSourceNode;
  left?: GainNode;
  right?: GainNode;
  splitter?: ChannelSplitterNode;
  merger?: ChannelMergerNode;
  offset?: number;
  contextAt?: number;
  stopAt?: number;
}

/** Original event sounds, driven by the same active presentation clock as film. */
export class LessonAudio {
  private context: AudioContext | null = null;
  private readonly sounds: Map<number, LessonSound>;
  private readonly buffers = new Map<number, AudioBuffer>();
  private readonly pending = new Map<number, Promise<void>>();
  private readonly failures = new Set<number>();
  private readonly requests = new Set<AbortController>();
  private readonly live = new Set<PlayingCue>();
  private readonly visited = new Map<LessonSoundCue, number[]>();
  private disposed = false;
  private time = 0;

  constructor(
    private readonly lesson: LessonAudioDefinition,
    private readonly reportError: (error: unknown) => void,
  ) {
    this.sounds = new Map(lesson.audioAssets.map(sound => [sound.soundId, sound]));
  }

  /** Called directly from Play/Sound's user gesture, never during construction. */
  async activate(): Promise<void> {
    if (this.disposed) return;
    this.context ??= new AudioContext();
    await this.context.resume();
  }

  private prepare(soundId: number): Promise<void> {
    if (this.buffers.has(soundId) || this.failures.has(soundId) || this.disposed) return Promise.resolve();
    const pending = this.pending.get(soundId);
    if (pending) return pending;
    const sound = this.sounds.get(soundId)!;
    const controller = new AbortController();
    this.requests.add(controller);
    const task = (async () => {
      if (!this.context) return;
      const response = await fetch(lessonMediaUrl(sound.src, ".mp3"), { signal: controller.signal });
      if (!response.ok) throw new Error(`Lesson sound ${response.status}: ${sound.src}`);
      const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
      if (!this.disposed) this.buffers.set(soundId, buffer);
    })().catch((error: unknown) => {
      if (this.disposed || controller.signal.aborted) return;
      this.failures.add(soundId);
      this.reportError(error);
    }).finally(() => {
      this.requests.delete(controller);
      this.pending.delete(soundId);
    });
    this.pending.set(soundId, task);
    return task;
  }

  ready(from: number, through: number): boolean {
    return this.lesson.audioCues.every(cue => cue.frame < from || cue.frame > through
      || cue.sync === "stop" || this.buffers.has(cue.soundId) || this.failures.has(cue.soundId));
  }

  async prepareRange(from: number, through: number): Promise<void> {
    const sounds = new Set(this.lesson.audioCues
      .filter(cue => cue.frame >= from && cue.frame <= through && cue.sync !== "stop")
      .map(cue => cue.soundId));
    await Promise.all([...sounds].map(id => this.prepare(id)));
  }

  private stop(record: PlayingCue): void {
    try { record.node?.stop(); } catch { /* A source may already have ended. */ }
    record.node?.disconnect();
    record.left?.disconnect();
    record.right?.disconnect();
    record.splitter?.disconnect();
    record.merger?.disconnect();
    record.node = undefined;
    record.left = undefined;
    record.right = undefined;
    record.splitter = undefined;
    record.merger = undefined;
  }

  private duration(cue: LessonSoundCue): number {
    const sound = this.sounds.get(cue.soundId)!;
    const end = Math.min(sound.sampleCount / sound.sampleRate, cue.outPoint44 === null
      ? Infinity : cue.outPoint44 / 44100);
    return Math.max(0, end - cue.inPoint44 / 44100);
  }

  visit(frame: number, at: number, retainLoopSound = false): void {
    if (this.disposed) return;
    for (const cue of this.lesson.audioCues) {
      if (cue.frame !== frame) continue;
      const visits = this.visited.get(cue) ?? [];
      if (visits.some(previous => Math.abs(previous - at) < 1e-6)) continue;
      visits.push(at);
      this.visited.set(cue, visits);
      if (cue.sync === "stop") {
        this.live.add({ cue, at });
        this.applyStops();
      } else if ((!retainLoopSound && cue.sync !== "start") || ![...this.live].some(active =>
        active.cue.sync !== "stop" && active.cue.soundId === cue.soundId && active.at <= at
        && at < Math.min(active.stopAt ?? Infinity, active.at + this.duration(active.cue) * active.cue.loops))) {
        this.live.add({ cue, at });
      }
    }
  }

  /** Queue only; decoding never starts playback outside an active sync. */
  schedule(frame: number, at: number): void {
    this.visit(frame, at);
    if (this.context) {
      for (const cue of this.lesson.audioCues) {
        if (cue.frame === frame && cue.sync !== "stop") void this.prepare(cue.soundId);
      }
    }
  }

  playSound(soundId: number, at: number): void {
    if (!this.sounds.has(soundId)) return;
    this.live.add({ at, cue: { frame: 0, soundId, sync: "event", loops: 1,
      inPoint44: 0, outPoint44: null, envelope: [] } });
    void this.prepare(soundId);
  }

  reset(frame: number): void {
    for (const active of this.live) this.stop(active);
    this.live.clear();
    this.visited.clear();
    this.time = 0;
    // Reconstruct sounds already active at an authored initial/question frame.
    // Timed source holds count as presentation time; manual waits cannot be
    // inferred when entering a branch and are never invented here.
    let previous = -1;
    for (const cue of this.lesson.audioCues) {
      if (cue.frame > frame) break;
      if (cue.frame === previous) continue;
      previous = cue.frame;
      const holds = this.lesson.stops.reduce((sum, stop) => sum + (
        stop.kind === "timed" && stop.frame >= cue.frame && stop.frame < frame ? stop.delayMs! / 1000 : 0
      ), 0);
      this.visit(cue.frame, -((frame - cue.frame) / this.lesson.fps + holds));
    }
  }

  stopAll(): void {
    for (const record of this.live) this.stop(record);
    this.live.clear();
    this.visited.clear();
  }

  private applyStops(): void {
    // Stop tags affect preceding instances only, including source ordering for
    // tags sharing a presentation instant. Later event sounds may overlap.
    for (const stop of this.live) {
      if (stop.cue.sync !== "stop") continue;
      for (const record of this.live) {
        if (record.cue.sync === "stop" || record.cue.soundId !== stop.cue.soundId) continue;
        if (record.at < stop.at || (Math.abs(record.at - stop.at) < 1e-6
          && this.lesson.audioCues.indexOf(record.cue) < this.lesson.audioCues.indexOf(stop.cue))) {
          record.stopAt = Math.min(record.stopAt ?? Infinity, stop.at);
        }
      }
    }
  }

  sync(time: number, enabled: boolean): void {
    this.time = time;
    const context = this.context;
    // Keep deduplication through delayed actual visits, including suppressed
    // sync-start and already-consumed stop tags, without retaining whole runs.
    for (const [cue, visits] of this.visited) {
      const recent = visits.filter(at => at >= time - 60);
      if (recent.length) this.visited.set(cue, recent);
      else this.visited.delete(cue);
    }
    this.applyStops();
    for (const record of this.live) {
      if (record.cue.sync === "stop") {
        if (record.at <= time) this.live.delete(record);
        continue;
      }
      const sound = this.sounds.get(record.cue.soundId)!;
      const age = time - record.at;
      const span = this.duration(record.cue);
      if (age >= span * record.cue.loops || time >= (record.stopAt ?? Infinity) || span <= 0) {
        this.stop(record);
        this.live.delete(record);
        continue;
      }
      if (!enabled || !context || context.state !== "running") {
        this.stop(record);
        continue;
      }
      const buffer = this.buffers.get(record.cue.soundId);
      if (!buffer) continue;
      const elapsed = Math.max(0, age);
      const sourceTime = record.cue.inPoint44 / 44100 + elapsed % span;
      const priming = Math.max(0, sound.seekSamples ?? 0) / sound.sampleRate;
      const offset = sourceTime + priming;
      if (offset >= buffer.duration) continue;
      // A suspended tab or a long main-thread frame cannot leave narration
      // running ahead of the drawing clock.
      if (record.node && Math.abs((context.currentTime - record.contextAt!) + record.offset! - age) > .15) {
        this.stop(record);
      }
      if (!record.node) {
        const node = context.createBufferSource();
        const left = context.createGain();
        const right = context.createGain();
        const merger = context.createChannelMerger(2);
        node.buffer = buffer;
        if (buffer.numberOfChannels > 1) {
          const splitter = context.createChannelSplitter(2);
          node.connect(splitter);
          splitter.connect(left, 0);
          splitter.connect(right, 1);
          record.splitter = splitter;
        } else {
          node.connect(left);
          node.connect(right);
        }
        left.connect(merger, 0, 0);
        right.connect(merger, 0, 1);
        merger.connect(context.destination);
        if (record.cue.loops > 1) {
          node.loop = true;
          node.loopStart = record.cue.inPoint44 / 44100 + priming;
          node.loopEnd = Math.min(buffer.duration, node.loopStart + span);
        }
        record.node = node;
        record.left = left;
        record.right = right;
        record.merger = merger;
        const when = context.currentTime + Math.max(0, -age);
        const duration = Math.min(span * record.cue.loops - elapsed,
          record.cue.loops > 1 ? Infinity : buffer.duration - offset);
        record.offset = elapsed;
        record.contextAt = when;
        this.automate(record, when, elapsed, span, duration);
        node.start(when, offset, duration);
      }
      if (record.stopAt !== undefined) record.node!.stop(context.currentTime + Math.max(0, record.stopAt - time));
    }
  }

  private automate(record: PlayingCue, when: number, age: number, span: number, duration: number): void {
    const cue = record.cue;
    const crop = cue.inPoint44 / 44100;
    for (const channel of ["left", "right"] as const) {
      const param = record[channel]!.gain;
      param.setValueAtTime(lessonEnvelopeGain(cue, crop + age % span, channel), when);
      // Schedule finite loop envelopes on the audio clock, independent of RAF.
      for (let loop = Math.floor(age / span); loop < cue.loops; loop++) {
        const loopAge = loop * span;
        if (loopAge > age && loopAge < age + duration) {
          param.setValueAtTime(lessonEnvelopeGain(cue, crop, channel), when + loopAge - age);
        }
        let mark = 0;
        let lastEventAge = -Infinity;
        for (const point of cue.envelope) {
          mark = Math.max(mark, point.mark44);
          const eventAge = loopAge + mark / 44100 - crop;
          if (eventAge <= age || eventAge > age + duration || eventAge > loopAge + span) continue;
          if (eventAge === lastEventAge) {
            // Collapsed/nonmonotonic marks are an authored step, not a fade
            // replacing the preceding ramp at the same timestamp.
            param.setValueAtTime(point[channel] / 32768, when + eventAge - age);
          } else {
            param.linearRampToValueAtTime(point[channel] / 32768, when + eventAge - age);
          }
          lastEventAge = eventAge;
        }
        const endAge = Math.min(loopAge + span, age + duration);
        if (endAge > age && endAge > lastEventAge) param.linearRampToValueAtTime(
          lessonEnvelopeGain(cue, crop + endAge - loopAge, channel), when + endAge - age);
        if (endAge >= age + duration) break;
      }
    }
  }

  retry(): void { this.failures.clear(); }

  get activeCount(): number { return [...this.live].filter(record => record.cue.sync !== "stop").length; }

  pause(): void { this.sync(this.time, false); }

  dispose(): void {
    this.disposed = true;
    for (const request of this.requests) request.abort();
    for (const record of this.live) this.stop(record);
    this.live.clear();
    this.visited.clear();
    this.buffers.clear();
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
