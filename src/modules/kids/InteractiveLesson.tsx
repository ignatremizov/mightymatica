import { useMemo, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import OriginalLessonPlayer from "../../shared/OriginalLessonPlayer";
import RecoveredActivity from "./OriginalBoard";
import audio from "./audio.json";
import stageData from "./lesson-stages.json";
import { interactiveLesson, type KidsSourceLesson } from "./lessonRules";

const sources = audio as Record<string, KidsSourceLesson>;
const stages = stageData as Record<string, { stages: { frame: number; successFrame: number }[] }>;

export default function InteractiveLesson(props: ActivityProps) {
  const [restart, setRestart] = useState(0);
  return <InteractiveBoardLesson key={restart} {...props} onReset={() => setRestart(value => value + 1)} />;
}

function InteractiveBoardLesson(props: ActivityProps & { onReset: () => void }) {
  const [question, setQuestion] = useState<number | null>(null);
  const [lastQuestion, setLastQuestion] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);
  const gates = stages[props.activityId]!.stages;
  const lesson = useMemo(() => interactiveLesson(sources[props.activityId]!, props.activityId, gates), [props.activityId, gates]);
  const gate = question === null ? undefined : gates[question];
  const actions = gate && solved ? {
    [gate.frame]: [{
      label: t(props.locale, question === gates.length - 1 ? "Finish" : "Continue",
        question === gates.length - 1 ? "Завершить" : "Продолжить"),
      targetFrame: gate.successFrame,
    }],
  } : {};
  return <div className={question === null ? "kids-lesson" : "kids-lesson kids-lesson--question"}>
    <OriginalLessonPlayer lesson={lesson} locale={props.locale} reducedMotion={props.reducedMotion}
      label={t(props.locale, "Original illustrated lesson", "Оригинальное иллюстрированное занятие")}
      blockedStopFrames={gates.map(item => item.frame)}
      stopActions={actions}
      onStop={frame => {
        const index = gates.findIndex(item => item.frame === frame);
        if (index >= 0) { setQuestion(index); setLastQuestion(index); setSolved(false); }
      }}
      onLeaveStop={() => setQuestion(null)}
      onRestart={props.onReset} />
    {lastQuestion !== null && <div style={{ display: question === null ? "none" : undefined }}>
      <RecoveredActivity key={lastQuestion} {...props}
        startStage={lastQuestion} initialScore={score} onScoreChange={setScore}
        onComplete={() => setSolved(true)} onRestart={props.onReset} />
    </div>}
  </div>;
}
