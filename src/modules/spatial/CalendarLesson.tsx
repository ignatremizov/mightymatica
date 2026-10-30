import { useEffect, useRef, useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import { LessonAudio } from "../../shared/LessonAudio";
import type { OriginalLessonDefinition } from "../../shared/OriginalLesson";
import { useAnimation } from "../../shared/useAnimation";
import { useDragRotation } from "./useDragRotation";
import english from "../../../public/media/spatial/audio/calendar-en/audio.json";
import russian from "../../../public/media/spatial/audio/calendar-ru/audio.json";

// Source scenes stop at global 1,3,5,7,9,11. Their Timer-driven cube motion
// continues at each stop, so a frame-only static timeline is not a renderer.
const definitions = {
  en: { ...english, initialFrame:1,endFrame:12,chapters:[],stops:[] },
  ru: { ...russian, initialFrame:1,endFrame:12,chapters:[],stops:[] },
} satisfies Record<string,OriginalLessonDefinition>;
// XFL child order, recovered from cube16,25,48,58,59,64,65,69,75.
const cubes = [
  [[5,1,6,3,2,0],[5,4,1,6,3,7]],
  [[5,1,6,3,2,0],[5,1,6,3,2,0]],
  [[5,4,6,3,7,1],[5,4,6,3,7,1]],
  [[5,1,6,3,0,2],[5,1,6,3,0,2]],
  [[5,1,0,3,6,2],[5,1,0,3,6,2]],
  [[5,1,0,3,2,6]],
];
const faceTransforms=["rotateY(90deg)","rotateY(-90deg)","rotateX(-90deg)","rotateX(90deg)","","rotateY(180deg)"];
const sceneText = [
  ["Can you put the digits 0 to 9 on the faces of two cubes to show any date from 01 to 31?",
    "Можно ли разместить на сторонах двух кубиков цифры от 0 до 9, чтобы показать любое число месяца от 01 до 31?"],
  ["Each cube must have 0. Otherwise, the other cube would need nine faces for 1 through 9 to show 01, 02, …, 09.",
    "Каждый кубик должен иметь 0. Иначе на втором потребуются девять граней для цифр от 1 до 9, чтобы показать 01, 02, …, 09."],
  ["Each cube must have 1, so that the two cubes can show 11.",
    "Каждый кубик должен иметь 1, чтобы показать дату 11."],
  ["Each cube must have 2, so that the two cubes can show 22.",
    "Каждый кубик должен иметь 2, чтобы показать дату 22."],
  ["Three faces of each cube are occupied by 0, 1 and 2. That leaves only six faces for seven digits: 3, 4, 5, 6, 7, 8 and 9. Does that make the calendar impossible?",
    "Три грани каждого кубика заняты цифрами 0, 1 и 2. Остаётся всего шесть граней для семи цифр: 3, 4, 5, 6, 7, 8 и 9. Значит, календарь невозможен?"],
  ["But it is possible! Turn the cube: the same face can show both 6 and 9.",
    "Но календарь всё же возможен! Поверните кубик: 6 и 9 можно представить одной и той же гранью."],
];

function CalendarCube({digits,playing,reducedMotion,scene,index,onInspect}:{digits:number[];playing:boolean;reducedMotion:boolean;scene:number;index:number;onInspect:()=>void}) {
  const node=useRef<HTMLDivElement>(null);
  const phase=useRef(0);
  const [turn,setTurn]=useState(-30),[tilt,setTilt]=useState(-25);
  const [roll,setRoll]=useState(0);
  useEffect(()=>{phase.current=0;setTurn(-30);setTilt(-25);setRoll(0);},[scene]);
  const current=()=>{
    const amount=phase.current;
    return {turn:turn+(scene===0?amount:0),tilt:tilt+(scene===0?amount:0),roll:roll+(scene===0?0:amount*(index?-2:1))};
  };
  useAnimation(delta=>{
    phase.current+=delta*24;
    const angles=current();
    if(node.current)node.current.style.transform=`rotateX(${angles.tilt}deg) rotateY(${angles.turn}deg) rotateZ(${angles.roll}deg)`;
  },playing&&!reducedMotion);
  const drag=useDragRotation(turn,tilt,(yaw,pitch)=>{
    onInspect();phase.current=0;setTurn(yaw);setTilt(pitch);
  },()=>{
    const angles=current();setRoll(angles.roll);return angles;
  });
  return <div className="spatial-calendar-cube-view spatial-drag-rotate" {...drag}>
    <div className="spatial-calendar-cube" ref={node} style={{transform:`rotateX(${tilt}deg) rotateY(${turn}deg) rotateZ(${roll}deg)`}}>
      {digits.map((digit,face)=><span key={face} style={{transform:`${faceTransforms[face]} translateZ(55px)`}}>{digit}</span>)}
    </div>
  </div>;
}

/** Source six-scene interactive audiovisual lesson; Play never skips a hint gate. */
export default function CalendarLesson({locale,reducedMotion}:ActivityProps) {
  const definition=definitions[locale];
  const [scene,setScene]=useState(0),[playing,setPlaying]=useState(false);
  const [sound,setSound]=useState(true),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false);
  const owner=useRef<LessonAudio|null>(null),elapsed=useRef(0),operation=useRef(0);
  useEffect(()=>{
    const audio=new LessonAudio(definition,()=>setFailed(true));
    owner.current=audio;audio.reset(1);elapsed.current=0;setScene(0);setPlaying(false);setFailed(false);
    return ()=>{operation.current++;audio.dispose();if(owner.current===audio)owner.current=null;};
  },[definition]);
  const pause=()=>{operation.current++;owner.current?.pause();setPlaying(false);setLoading(false);};
  useEffect(()=>{if(reducedMotion)pause();},[reducedMotion]);
  const play=async()=>{
    const audio=owner.current;
    if(!audio)return;
    const request=++operation.current;
    setFailed(false);
    if(sound){
      setLoading(true);
      try{
        await audio.activate();await audio.prepareRange(1,12);
      }catch{
        if(request===operation.current){setFailed(true);setLoading(false);}
        return;
      }
    }
    if(request!==operation.current||owner.current!==audio)return;
    setLoading(false);setPlaying(true);
  };
  useAnimation(delta=>{
    elapsed.current+=delta;
    owner.current?.sync(elapsed.current,sound);
  },playing&&!loading,{preserveElapsed:true});
  const next=()=>{
    if(scene>=5)return;
    const nextScene=scene+1;
    owner.current?.visit(nextScene*2+1,elapsed.current);
    setScene(nextScene);
  };
  const restart=()=>{
    pause();elapsed.current=0;owner.current?.reset(1);setScene(0);setFailed(false);
  };
  return <section className="spatial-calendar-lesson" aria-label={t(locale,"Two-cube calendar lesson","Урок о календаре из двух кубиков")}>
    <p className="explanation" aria-live="polite">{sceneText[scene][locale==="ru"?1:0]}</p>
    <div className="spatial-calendar-film" role="img" aria-label={t(locale,"Rotating calendar cubes; drag a cube to inspect its faces.","Вращающиеся кубики календаря; перетаскивайте кубик для осмотра граней.")}>
      {cubes[scene].map((digits,index)=><CalendarCube key={index} digits={digits} index={index} scene={scene} playing={playing&&!loading} reducedMotion={reducedMotion} onInspect={pause}/>)}
    </div>
    <div className="controls" role="group" aria-label={t(locale,"Lesson controls","Управление уроком")}>
      <button type="button" className="button" disabled={loading} onClick={()=>{if(playing)pause();else void play();}}>{t(locale,playing?"Pause":"Play",playing?"Пауза":"Воспроизвести")}</button>
      {scene<5&&<button type="button" className="button" onClick={next}>{t(locale,scene===0?"Hint":"Next",scene===0?"Подсказка":"Дальше")}</button>}
      <button type="button" className="button-secondary" onClick={restart}>{t(locale,"Start over","Ещё раз")}</button>
      <label className="control"><input type="checkbox" checked={sound} onChange={event=>{
        pause();setSound(event.target.checked);
      }}/>{t(locale,"Sound","Звук")}</label>
    </div>
    {loading&&<p role="status">{t(locale,"Loading original audio…","Загрузка исходного звука…")}</p>}
    {failed&&<p role="status">{t(locale,"Some audio could not play. You can continue silently, or retry.","Не удалось воспроизвести часть звука. Можно продолжить без звука или повторить.")}<button type="button" onClick={()=>{owner.current?.retry();void play();}}>{t(locale,"Retry audio","Повторить загрузку звука")}</button></p>}
  </section>;
}
