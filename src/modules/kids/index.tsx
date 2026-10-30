import { useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import InteractiveLesson from "./InteractiveLesson";
import Kitten from "./Kitten";
import SortingPractice from "./SortingPractice";
import "./kids.css";

export default function KidsActivity(props: ActivityProps) {
  const [practice, setPractice] = useState(false);
  if (props.activityId === "kids-kitten") return <Kitten {...props} />;
  const sorting = props.activityId.startsWith("kids-share-");
  return <>
    {sorting && <div className="controls">
      <button type="button" className="button button-secondary" aria-pressed={practice}
        onClick={() => setPractice((value) => !value)}>
        {t(props.locale, practice ? "Original illustrated activity" : "Practice with descriptive labels",
          practice ? "Исходное иллюстрированное задание" : "Тренировка с описаниями")}
      </button>
    </div>}
    {sorting && practice ? <SortingPractice key={props.activityId} {...props} /> : <InteractiveLesson key={props.activityId} {...props} />}
  </>;
}
