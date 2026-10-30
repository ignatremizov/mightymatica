import { useState } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { t } from "../../shared/contracts";
import { canShowDate, foldNet } from "./rules";
import type { Cell, Vec } from "./rules";
import "./spatial.css";
import { Companion, PairActivity } from "./Companions";
import { DraggableNet } from "./DraggableNet";
import { useDragRotation } from "./useDragRotation";
import { originalChoiceCells, originalChoiceStages, originalElevenNets, originalNetColors, originalTargetCells } from "./OriginalNets";
import { useAnimation } from "../../shared/useAnimation";
import { choiceArtwork, netFaceUrl, rearrangeArtwork } from "./NetArtwork";
import type { NetFaceArtwork } from "./NetArtwork";
import { useSourceAudio } from "./useSourceAudio";
import CalendarLesson from "./CalendarLesson";

// CubeNG's authored six-face palette (the numbered puzzles remain adaptations).
const colors = ["#ffff66","#ff66ff","#ff0099","#cccccc","#6633ff","#00cc00"];
const target = [1,2,3,4,5,6];
// Cubenetslide-1..5: T1..T6 share these target/initial slots.
const rearrangeCells: Cell[] = [[0,1],[1,1],[2,1],[3,1],[2,0],[2,2]];
const rearrangeTarget = [1,3,6,4,2,5];
const rearrangeInitial = [3,6,4,2,1,5];

function Solid({ cells, labels, fold, yaw, pitch, label, onRotate, faceColors=colors, showNumbers=true, artwork }: { cells: Cell[]; labels: number[]; fold: number; yaw: number; pitch: number; label: string; onRotate: (yaw:number,pitch:number)=>void; faceColors?:string[]; showNumbers?:boolean; artwork?:NetFaceArtwork[] }) {
  const rotation=useDragRotation(yaw,pitch,onRotate);
  const faces=foldNet(cells,fold);
  const center=faces.reduce((sum,f)=>sum.map((v,i)=>v+f.center[i]/6) as Vec,[0,0,0] as Vec);
  const transform=(p:Vec):Vec=>{
    const [x,y,z]=p.map((v,i)=>v-center[i]);
    const a=yaw*Math.PI/180,b=pitch*Math.PI/180;
    const xx=x*Math.cos(a)+z*Math.sin(a), zz=-x*Math.sin(a)+z*Math.cos(a);
    return [xx,y*Math.cos(b)-zz*Math.sin(b),y*Math.sin(b)+zz*Math.cos(b)];
  };
  const panels=faces.map((f,i)=>{
    const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>transform(f.center.map((n,k)=>n+u*f.right[k]/2+v*f.down[k]/2) as Vec));
    return {i,corners,mid:transform(f.center)};
  }).sort((a,b)=>a.mid[2]-b.mid[2]);
  return <svg className="diagram spatial-solid spatial-drag-rotate" viewBox="-180 -140 360 280" role="img" aria-label={label} {...rotation}>
    <title>{label}</title>
    {panels.map(({i,corners,mid})=><g key={i}>
      <polygon points={corners.map(p=>`${p[0]*49},${p[1]*49}`).join(" ")} fill={artwork?"#fff":faceColors[labels[i]-1]} stroke="#253544" strokeWidth="1.5"/>
      {artwork&&(()=>{
        const face=artwork[labels[i]-1],a=corners[0],b=corners[1],d=corners[3];
        return <image href={netFaceUrl(face)} transform={`matrix(${(b[0]-a[0])*49} ${(b[1]-a[1])*49} ${(d[0]-a[0])*49} ${(d[1]-a[1])*49} ${a[0]*49} ${a[1]*49})`}
          x={(face.origin.x+20)/40} y={(face.origin.y+20)/40} width={face.bounds.width/40} height={face.bounds.height/40} preserveAspectRatio="none"/>;
      })()}
      {showNumbers&&!artwork&&<text x={mid[0]*49} y={mid[1]*49} textAnchor="middle" dominantBaseline="central" fill="#172634" fontSize="19" fontWeight="700">{labels[i]}</text>}
    </g>)}
  </svg>;
}

function Net({cells,labels,artwork}:{cells:Cell[];labels:number[];artwork:NetFaceArtwork[]}) {
  const width=Math.max(...cells.map(c=>c[0]))+1,height=Math.max(...cells.map(c=>c[1]))+1;
  return <div className="spatial-net" style={{gridTemplateColumns:`repeat(${width}, 2.8rem)`,gridTemplateRows:`repeat(${height}, 2.8rem)`}}>
    {cells.map(([x,y],i)=>{
      const face=artwork[labels[i]-1];
      return <span key={i} className="spatial-face spatial-art-face" style={{gridColumn:x+1,gridRow:y+1}}>
        <img src={netFaceUrl(face)} alt="" draggable={false} style={{left:`${(face.origin.x+20)*2.5}%`,top:`${(face.origin.y+20)*2.5}%`,width:`${face.bounds.width*2.5}%`,height:`${face.bounds.height*2.5}%`}}/>
      </span>;
    })}
  </div>;
}

function NetsActivity({activityId,locale,reducedMotion}:ActivityProps) {
  const audio=useSourceAudio();
  const ru=locale==="ru", explorer=activityId==="spatial-eleven-nets", rearrange=activityId==="spatial-net-rearrange";
  const [stage,setStage]=useState(0),[netIndex,setNetIndex]=useState(0),[fold,setFold]=useState(0);
  const [folding,setFolding]=useState(false);
  useAnimation(delta=>setFold(current=>Math.min(1,current+delta/2)),folding&&fold<1&&!reducedMotion);
  const [yaw,setYaw]=useState(32),[pitch,setPitch]=useState(-26),[answer,setAnswer]=useState<number|null>(null);
  const [submittedAnswer,setSubmittedAnswer]=useState<number|null>(null);
  const [labels,setLabels]=useState(rearrangeInitial),[selected,setSelected]=useState<number|null>(null),[checked,setChecked]=useState(false);
  const choiceStage=originalChoiceStages[stage];
  const cells=rearrange?rearrangeCells:explorer?originalElevenNets[netIndex]:originalChoiceCells[answer??0];
  const targetLabels=rearrange?rearrangeTarget:choiceStage.target;
  const artwork=explorer?undefined:rearrange?rearrangeArtwork(stage):choiceArtwork(stage);
  const rotate=(turn:number,tilt:number)=>{setYaw(((turn+180)%360+360)%360-180);setPitch(Math.max(-85,Math.min(85,tilt)));};
  const options=choiceStage.options;
  const displayed=explorer?target:rearrange?labels:answer===null?target:options[answer];
  // Cubenetslide checks all six authored slots. Keep its T4.x typo corrected;
  // do not accept a motif with the wrong in-plane orientation as a rotated cube.
  const success=rearrange?labels.every((label,i)=>label===rearrangeTarget[i]):submittedAnswer===choiceStage.correct;
  const reset=()=>{audio.stop();setAnswer(null);setSubmittedAnswer(null);setChecked(false);setSelected(null);setFold(0);setLabels(rearrangeInitial);};
  const submit=()=>{
    if(!rearrange){
      if(answer===null)return;
      setSubmittedAnswer(answer);
      audio.play(answer===choiceStage.correct?"move":"wrong");
      if(answer===choiceStage.correct)audio.play("correct");
    }
    setChecked(true);
  };
  const swap=(first:number,second:number)=>{
    if(first===second){setSelected(null);return;}
    const next=[...labels];
    [next[first],next[second]]=[next[second],next[first]];
    audio.play("move");
    if(next.every((label,i)=>label===rearrangeTarget[i]))audio.play("correct");
    setLabels(next);setSelected(null);setFold(0);setChecked(true);
  };
  return <div className={`activity-layout spatial-activity${explorer?" spatial-eleven-nets":""}`}>
    {!explorer&&<label className="control spatial-sound-toggle"><input type="checkbox" checked={audio.enabled} onChange={event=>audio.toggle(event.target.checked)}/><span>{t(locale,"Sound effects","Звуковые эффекты")}</span></label>}
    {audio.failed&&<p role="status">{t(locale,"Sound could not play. Toggle sound off and on to try again.","Не удалось воспроизвести звук. Выключите и включите звук, чтобы повторить.")}</p>}
    {!rearrange&&<p className="explanation">{explorer?t(locale,"Choose a net to fold it into a cube. Drag the view to turn it; use the fold slider to inspect any position.","Выберите развёртку, чтобы сложить её в куб. Перетаскивайте изображение для поворота; ползунок позволяет рассмотреть любой момент складывания."):
      t(locale,"Which net folds into the target cube? Rotate the target to inspect all six faces. Select a net to preview it, then press Check to submit your answer.","Какая развёртка даёт заданный куб? Поверните образец, выберите развёртку для предварительного просмотра, затем нажмите «Проверить», чтобы отправить ответ.")}</p>}
    {!explorer&&<div className="controls" role="group" aria-label={t(locale,"Choose a stage","Выберите этап")}>
      <span>{t(locale,"Stage","Этап")}</span>{originalChoiceStages.map((_,i)=><button type="button" className="button-secondary" key={i} aria-pressed={stage===i} onClick={()=>{setStage(i);reset();}}>{i+1}</button>)}
    </div>}
    {explorer&&<div className="spatial-net-picker" role="group" aria-label={t(locale,"Choose a net","Выберите развёртку")}>{originalElevenNets.map((net,i)=><button type="button" key={i} className="button-secondary" aria-pressed={netIndex===i} aria-label={t(locale,`Net ${i+1}`,`Развёртка ${i+1}`)} onClick={()=>{setNetIndex(i);setFold(reducedMotion?1:0);setFolding(!reducedMotion);}}>
      <svg viewBox="0 0 50 60" aria-hidden="true">{net.map(([x,y],face)=><rect key={face} x={x*10+5} y={y*10+5} width="10" height="10" fill={originalNetColors[face]} stroke="#172634" strokeWidth=".7"/>)}</svg><span>{i+1}</span>
    </button>)}</div>}
    {rearrange&&<section className="spatial-face-editor" aria-label={t(locale,"Rearrange the faces","Переставьте грани")}>
      <p className="explanation">{t(locale,"Drag a face onto another face to swap them and match the target cube. You can also select two faces with a click, tap, or keyboard. Compare and fold your net below.","Перетащите грань на другую, чтобы поменять их местами и получить заданный куб. Также можно выбрать две грани щелчком, касанием или с клавиатуры. Ниже можно сравнить и сложить развёртку.")}</p>
      <DraggableNet locale={locale} cells={cells} labels={labels} colors={colors} artwork={artwork!} selected={selected} onSwap={swap} onSelect={i=>{if(selected===null)setSelected(i);else swap(selected,i);}}/>
    </section>}
    <section className="spatial-comparison" aria-label={t(locale,"Compare and fold","Сравните и сложите")}>
    <div className="spatial-views">
      {!explorer&&<section><h3>{t(locale,"Target cube","Образец")}</h3><Solid cells={rearrange?rearrangeCells:originalTargetCells} labels={targetLabels} fold={1} yaw={yaw} pitch={pitch} onRotate={rotate} artwork={artwork} label={t(locale,"Target cube with six marked faces","Куб-образец с шестью отмеченными гранями")}/></section>}
      <section><h3>{t(locale,"Your net","Ваша развёртка")}</h3>{!explorer&&!rearrange&&answer===null?
        <p className="spatial-preview-note">{t(locale,"Choose one of the four nets below to inspect it here.","Выберите одну из четырёх развёрток ниже, чтобы рассмотреть её здесь.")}</p>:
        <Solid cells={cells} labels={displayed} fold={fold} yaw={yaw} pitch={pitch} onRotate={rotate} artwork={artwork} faceColors={explorer?originalNetColors:colors} showNumbers={!explorer} label={t(locale,`Net folded ${Math.round(fold*100)} percent`,`Развёртка сложена на ${Math.round(fold*100)} процентов`)}/>}</section>
    </div>
    <div className="controls spatial-view-controls" role="group" aria-label={t(locale,"View controls","Управление видом")}>
      <label className="control"><span>{t(locale,"Turn","Поворот")} <output>{Math.round(yaw)}°</output></span><input type="range" min="-180" max="180" value={yaw} aria-valuetext={t(locale,`${Math.round(yaw)} degrees`,`${Math.round(yaw)} градусов`)} onChange={e=>setYaw(Number(e.target.value))}/></label>
      <label className="control"><span>{t(locale,"Tilt","Наклон")} <output>{Math.round(pitch)}°</output></span><input type="range" min="-85" max="85" value={pitch} aria-valuetext={t(locale,`${Math.round(pitch)} degrees`,`${Math.round(pitch)} градусов`)} onChange={e=>setPitch(Number(e.target.value))}/></label>
      <label className="control"><span>{t(locale,"Fold","Сложить")} <output>{Math.round(fold*90)}°</output></span><input type="range" min="0" max="100" value={fold*100} aria-valuetext={t(locale,`${Math.round(fold*90)} degrees folded`,`${Math.round(fold*90)} градусов складывания`)} disabled={!explorer&&!checked} onChange={e=>{setFolding(false);setFold(Number(e.target.value)/100);}}/></label>
      {explorer&&folding&&fold<1&&<button type="button" className="button-secondary" onClick={()=>setFolding(false)}>{t(locale,"Pause folding","Остановить складывание")}</button>}
    </div>
    </section>
    {!rearrange&&!explorer&&<div className="choice-grid">{options.map((option,i)=><button className="button-secondary spatial-option" key={i} aria-pressed={answer===i} onClick={()=>{audio.stop();setAnswer(i);setSubmittedAnswer(null);setChecked(false);setFold(0);}}><span>{ru?"Вариант":"Option"} {i+1}</span><Net cells={originalChoiceCells[i]} labels={option} artwork={artwork!}/></button>)}</div>}
    {!explorer&&<div className="controls"><button className="button" disabled={!rearrange&&answer===null} onClick={submit}>{t(locale,"Check","Проверить")}</button><button className="button-secondary" onClick={reset}>{t(locale,"Reset stage","Начать этап заново")}</button>{checked&&success&&stage<4&&<button className="button" onClick={()=>{setStage(stage+1);reset();}}>{t(locale,"Next stage","Следующий этап")}</button>}</div>}
    <p className="activity-status" role="status">{checked?(success?t(locale,"Correct — this net matches the target cube.","Верно — эта развёртка соответствует образцу."):t(locale,"Not yet. Fold the net and compare which faces meet.","Пока не совпадает. Сложите развёртку и сравните соседние грани.")):rearrange&&selected!==null?t(locale,"Now choose the second face.","Теперь выберите вторую грань."):""}</p>
  </div>;
}

const hintsEn=["Each cube needs 0: otherwise the other cube would need all nine digits 1–9.","Both cubes need 1, to show 11.","Both cubes need 2, to show 22.","Only six spaces remain for seven digits 3–9. Does that make the calendar impossible?","Turn a 6 upside down to make 9. Try 0,1,2,3,4,5 and 0,1,2,6,7,8."];
const hintsRu=["На обоих кубиках нужен 0, иначе на втором потребуются все девять цифр от 1 до 9.","На обоих кубиках нужна 1 для даты 11.","На обоих кубиках нужна 2 для даты 22.","Осталось шесть мест для семи цифр от 3 до 9. Значит, календарь невозможен?","Переверните 6, чтобы получить 9. Решение: 0,1,2,3,4,5 и 0,1,2,6,7,8."];
function Calendar({locale}:ActivityProps) {
  const [cubes,setCubes]=useState<number[][]>([[0,1,2,3,4,5],[0,1,2,3,4,5]]),[hint,setHint]=useState(0),[checked,setChecked]=useState(false),[day,setDay]=useState(1);
  const missing=Array.from({length:31},(_,i)=>i+1).filter(d=>!canShowDate(cubes[0],cubes[1],d));
  return <div className="activity-layout spatial-activity">
    <p className="explanation">{t(locale,"Can you put digits on the twelve faces of two cubes so they display every date from 01 to 31? Use one cube for each digit. You may exchange the cubes.","Можно ли разместить цифры на двенадцати гранях двух кубиков, чтобы показать любое число месяца от 01 до 31? Каждый кубик показывает одну цифру. Кубики можно менять местами.")}</p>
    <div className="spatial-views">{cubes.map((cube,c)=><fieldset key={c}><legend>{t(locale,"Cube","Кубик")} {c+1}</legend><div className="controls">{cube.map((digit,f)=><label className="control" key={f}>{t(locale,"Face","Грань")} {f+1}<select value={digit} onChange={e=>{setCubes(cubes.map((row,i)=>i===c?row.map((n,j)=>j===f?Number(e.target.value):n):row));setChecked(false);}}>{Array.from({length:10},(_,n)=><option key={n}>{n}</option>)}</select></label>)}</div></fieldset>)}</div>
    <div className="controls"><button className="button" onClick={()=>setChecked(true)}>{t(locale,"Test all dates","Проверить все даты")}</button><button className="button-secondary" disabled={hint===hintsEn.length} onClick={()=>setHint(hint+1)}>{t(locale,"Next hint","Следующая подсказка")} ({hint}/{hintsEn.length})</button><button className="button-secondary" onClick={()=>{setCubes([[0,1,2,3,4,5],[0,1,2,3,4,5]]);setHint(0);setChecked(false);setDay(1);}}>{t(locale,"Start over","Сначала")}</button></div>
    {hint>0&&<p className="explanation">{(locale==="ru"?hintsRu:hintsEn)[hint-1]}</p>}
    <p className="activity-status" role="status">{checked?(missing.length?t(locale,`Missing dates: ${missing.map(n=>String(n).padStart(2,"0")).join(", ")}.`, `Не получаются даты: ${missing.map(n=>String(n).padStart(2,"0")).join(", ")}.`):t(locale,"Success! All 31 dates can be displayed.","Получилось! Можно показать все 31 дату.")):""}</p>
    <label className="control">{t(locale,"Inspect date","Проверить дату")} <input type="number" min="1" max="31" value={day} onChange={e=>setDay(Math.max(1,Math.min(31,Number(e.target.value)||1)))}/></label>
    <p>{String(day).padStart(2,"0")}: {canShowDate(cubes[0],cubes[1],day)?t(locale,"possible","получается"):t(locale,"not possible with these faces","не получается с этими гранями")}</p>
  </div>;
}

export default function Spatial(props:ActivityProps) {
  if(props.activityId==="spatial-find-pair")return <PairActivity {...props}/>;
  if(["spatial-dodecahedron","spatial-octahedron","spatial-illustrated-cube"].includes(props.activityId))return <Companion key={props.activityId} {...props}/>;
  return props.activityId==="spatial-calendar-cubes"?<div className="activity-layout spatial-activity">
    <CalendarLesson {...props}/>
    <details><summary>{t(props.locale,"Try your own two-cube calendar","Попробуйте составить свой календарь")}</summary><Calendar {...props}/></details>
  </div>:<NetsActivity key={props.activityId} {...props}/>;
}
