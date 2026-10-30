import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { ActivityProps } from "../../shared/contracts";
import { mediaUrl, t } from "../../shared/contracts";
import { useAnimation } from "../../shared/useAnimation";
import { arrangement, pairCenters, pairStages, positions, sameArrangement } from "./PairRules";
import { Octahedron } from "./Octahedron";
import { useDragRotation } from "./useDragRotation";
import { useSourceAudio } from "./useSourceAudio";
import PairStageAudio from "./PairStageAudio";

const cubeTransforms=["rotateY(90deg) translateZ(18px)","rotateY(-90deg) translateZ(18px)","rotateX(90deg) translateZ(18px)","rotateX(-90deg) translateZ(18px)","translateZ(18px)","rotateY(180deg) translateZ(18px)"];
const palette=["#ffff66","#ff0099","#00cc00","#3399ff"];
const letters=["Y","R","G","B"];

export function PairActivity({locale,reducedMotion}:ActivityProps) {
  const audio=useSourceAudio();
  const [audioSession,setAudioSession]=useState(0);
  const [stage,setStage]=useState(0),[selected,setSelected]=useState<number[]>([]),[status,setStatus]=useState(""),[solved,setSolved]=useState(false);
  const [playing,setPlaying]=useState(!reducedMotion),[angle,setAngle]=useState(0);
  const [pointerEnd,setPointerEnd]=useState<[number,number]|null>(null);
  const gesture=useRef<{id:number;first:number;x:number;y:number;moved:boolean;target:HTMLButtonElement}|null>(null);
  const suppressClick=useRef(false);
  const music=useRef<HTMLAudioElement>(null);
  useEffect(()=>{
    const elements=[music.current];
    return ()=>{for(const element of elements)element?.pause();};
  },[stage,locale]);
  useEffect(()=>{if(reducedMotion)setPlaying(false);},[reducedMotion]);
  const board=useRef<HTMLDivElement>(null),phase=useRef(0);
  useAnimation(delta=>{
    phase.current+=delta*16;
    board.current?.querySelectorAll<HTMLElement>(".spatial-cluster").forEach((el,i)=>{
      el.style.transform=`rotateX(${25+phase.current}deg) rotateY(${35+phase.current*(i%2?-1:1)}deg) rotateZ(${phase.current/3}deg)`;
    });
  },playing&&selected.length===0&&pointerEnd===null);
  const connect=(first:number,index:number)=>{
    if(solved)return;
    if(first===index){setSelected([first]);return;}
    const ids=pairStages[stage];
    const correct=sameArrangement(arrangement(ids[first]),arrangement(ids[index]));
    if(!correct)audio.play("wrong");
    else if(stage===3)audio.play("complete");
    setSelected([first,index]);setSolved(correct);
    setStatus(correct?t(locale,"These are the same arrangement!","Это одинаковые наборы!"):t(locale,"Different arrangements. Choose another pair.","Наборы различаются. Выберите другую пару."));
  };
  const choose=(index:number)=>{
    if(solved)return;
    if(selected.length!==1){setSelected([index]);setStatus("");return;}
    if(selected[0]===index){setSelected([]);return;}
    connect(selected[0],index);
  };
  const finishGesture=()=>{
    const current=gesture.current;
    gesture.current=null;
    setPointerEnd(null);
    if(current?.target.hasPointerCapture(current.id))current.target.releasePointerCapture(current.id);
  };
  useEffect(()=>()=>{
    const current=gesture.current;
    gesture.current=null;
    if(current?.target.hasPointerCapture(current.id))current.target.releasePointerCapture(current.id);
  },[]);
  useEffect(()=>{
    const cancel=()=>{
      if(!document.hidden)return;
      music.current?.pause();
      if(gesture.current){suppressClick.current=true;finishGesture();setSelected([]);}
    };
    document.addEventListener("visibilitychange",cancel);
    return ()=>document.removeEventListener("visibilitychange",cancel);
  },[]);
  const pointerDown=(event:ReactPointerEvent<HTMLButtonElement>,index:number)=>{
    if(solved||gesture.current||!event.isPrimary||event.button!==0)return;
    suppressClick.current=false;
    gesture.current={id:event.pointerId,first:index,x:event.clientX,y:event.clientY,moved:false,target:event.currentTarget};
    audio.play("move");
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const current=gesture.current,rect=board.current?.getBoundingClientRect();
    if(!current||current.id!==event.pointerId||!rect)return;
    if(Math.hypot(event.clientX-current.x,event.clientY-current.y)<6&&!current.moved)return;
    current.moved=true;
    setSelected([current.first]);setStatus("");
    setPointerEnd([(event.clientX-rect.left)*1080/rect.width,(event.clientY-rect.top)*570/rect.height+150]);
  };
  const pointerUp=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const current=gesture.current;
    if(!current||current.id!==event.pointerId)return;
    if(current.moved){
      suppressClick.current=true;
      const target=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLButtonElement>("[data-pair-index]");
      if(target&&board.current?.contains(target))connect(current.first,Number(target.dataset.pairIndex));
    }
    finishGesture();
  };
  const resetStage=(next:number)=>{
    audio.stop();music.current?.pause();
    setAudioSession(value=>value+1);
    if(music.current)music.current.currentTime=0;
    finishGesture();setStage(next);setSelected([]);setSolved(false);setStatus("");
  };
  const centers=pairCenters[stage];
  const start=selected.length?centers[selected[0]]:null;
  const end=pointerEnd??(selected.length===2?centers[selected[1]]:null);
  return <div className="activity-layout spatial-activity">
    <label className="control"><input type="checkbox" checked={audio.enabled} onChange={event=>audio.toggle(event.target.checked)}/>{t(locale,"Sound effects","Звуковые эффекты")}</label>
    {audio.failed&&<p role="status">{t(locale,"Sound could not play. Toggle sound off and on to try again.","Не удалось воспроизвести звук. Выключите и включите звук, чтобы повторить.")}</p>}
    <div className="controls">
      {locale==="en"&&<PairStageAudio key={`${stage}-${audioSession}`} stage={stage} locale={locale}/>}
      {stage===0&&<label className="control">{t(locale,"Music","Музыка")}<audio ref={music} controls preload="none" onLoadedMetadata={event=>{event.currentTarget.volume=.2;}} src={mediaUrl("spatial/audio/effects/tzone2.mp3")}/></label>}
    </div>
    <p className="explanation">{t(locale,"Find two matching arrangements of eight colored cubes. Drag a blue line between them, or select each with a click, tap, or Tab and Enter. Rotation is allowed; mirror reflection is not. Letters identify colors: Y yellow, R red, G green, B blue.","Найдите два одинаковых набора из восьми цветных кубиков. Проведите синюю линию между ними или выберите каждый щелчком, касанием либо клавишами Tab и Enter. Поворот допустим, зеркальное отражение — нет. Буквы обозначают цвета: Y жёлтый, R красный, G зелёный, B синий.")}</p>
    <p>{t(locale,"Stage","Этап")} {stage+1} / 4</p>
    <div className="controls"><button className="button-secondary" onClick={()=>setPlaying(!playing)}>{playing?t(locale,"Pause rotation","Остановить вращение"):t(locale,"Resume rotation","Продолжить вращение")}</button><label className="control">{t(locale,"Inspect angle","Угол осмотра")}<input type="range" min="0" max="360" value={angle} onChange={e=>{setPlaying(false);setAngle(Number(e.target.value));phase.current=Number(e.target.value);board.current?.querySelectorAll<HTMLElement>(".spatial-cluster").forEach((el,i)=>{el.style.transform=`rotateX(${25+Number(e.target.value)}deg) rotateY(${35+Number(e.target.value)*(i%2?-1:1)}deg)`;});}}/></label></div>
    <div className="spatial-pair-grid" ref={board} onKeyDown={event=>{if(event.key==="Escape"){suppressClick.current=true;finishGesture();setSelected([]);setStatus("");}}}>
      {pairStages[stage].map((id,i)=><button key={`${stage}-${i}`} type="button" className="spatial-pair-card" data-pair-index={i} style={{left:`${centers[i][0]/10.8}%`,top:`${(centers[i][1]-150)/5.7}%`}} aria-label={`${t(locale,"Arrangement","Набор")} ${i+1}`} aria-pressed={selected.includes(i)}
        onPointerDown={event=>pointerDown(event,i)} onPointerMove={pointerMove} onPointerUp={pointerUp}
        onPointerCancel={()=>{suppressClick.current=true;finishGesture();setSelected([]);}}
        onLostPointerCapture={()=>{if(gesture.current){finishGesture();setSelected([]);}}}
        onClick={event=>{if(suppressClick.current&&event.detail!==0){suppressClick.current=false;return;}if(event.detail===0&&selected.length!==1)audio.play("move");choose(i);}}>
      <span className="spatial-pair-number">{i+1}</span><div className="spatial-cluster-viewport"><div className="spatial-cluster" style={{transform:`rotateX(${25+angle}deg) rotateY(${35+angle*(i%2?-1:1)}deg)`}}>
        {arrangement(id).map((color,c)=><div className="spatial-small-cube" key={c} style={{transform:`translate3d(${positions[c][0]*29}px,${positions[c][1]*29}px,${positions[c][2]*29}px)`}}>
          {cubeTransforms.map((transform,f)=><span key={f} style={{transform,background:palette[color]}}>{letters[color]}</span>)}
        </div>)}
      </div></div>
    </button>)}
      <svg className="spatial-pair-ink" viewBox="0 150 1080 570" aria-hidden="true">
        {start&&end&&<path d={`M ${start[0]} ${start[1]} Q ${(start[0]+end[0])/2+9} ${(start[1]+end[1])/2-9} ${end[0]} ${end[1]}`}/>}
        {selected.map(i=><path key={i} d={`M ${centers[i][0]-68} ${centers[i][1]-48} C ${centers[i][0]-105} ${centers[i][1]+60}, ${centers[i][0]+82} ${centers[i][1]+94}, ${centers[i][0]+86} ${centers[i][1]-8} C ${centers[i][0]+89} ${centers[i][1]-95}, ${centers[i][0]-67} ${centers[i][1]-91}, ${centers[i][0]-79} ${centers[i][1]-27}`}/>)}
      </svg>
    </div>
    <p className="activity-status" role="status">{status||t(locale,"Choose the first arrangement, then its matching partner.","Выберите первый набор, затем его пару.")}</p>
    <div className="controls">{solved&&stage<3&&<button className="button" onClick={()=>resetStage(stage+1)}>{t(locale,"Next stage","Следующий этап")}</button>}<button className="button-secondary" onClick={()=>resetStage(0)}>{t(locale,"Start over","Начать сначала")}</button></div>
    {solved&&stage===3&&<p>{t(locale,"All four stages complete!","Все четыре этапа пройдены!")}</p>}
  </div>;
}

interface Panel { transform:string; image?:string; clip?:string; color:string }
const phi=(1+Math.sqrt(5))/2;
function dodecaPanels():Panel[] {
  // Dodecahedron's face normals are the twelve vertices of its dual icosahedron.
  const normals:number[][]=[];
  for(const a of [-1,1])for(const b of [-phi,phi])normals.push([0,b,a],[a,0,b],[b,a,0]);
  const vertices:number[][]=[];
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])vertices.push([x,y,z]);
  for(const a of [-1,1])for(const b of [-1,1])vertices.push([0,a/phi,b*phi],[a/phi,b*phi,0],[b*phi,0,a/phi]);
  const images=[1,4,7,10,13,16,19,22,25,28,31,34];
  return normals.map((n,i)=>{
    const len=Math.hypot(...n),x=n[0]/len,y=n[1]/len,z=n[2]/len;
    const normal=[x,y,z];
    const support=Math.max(...vertices.map(v=>v.reduce((sum,k,j)=>sum+k*normal[j],0)));
    const vertex=vertices.find(v=>Math.abs(v.reduce((sum,k,j)=>sum+k*normal[j],0)-support)<1e-8)!;
    const radius=Math.sqrt(3-support*support),distance=75*support/radius;
    const down=vertex.map((v,j)=>-(v-normal[j]*support)/radius);
    const right=[down[1]*z-down[2]*y,down[2]*x-down[0]*z,down[0]*y-down[1]*x];
    const matrix=[...right,0,...down,0,...normal,0,x*distance,y*distance,z*distance,1];
    return {transform:`matrix3d(${matrix.join(",")})`,image:`spatial/dodecahedron/${images[i]}.png`,clip:"polygon(50% 0%, 97.55% 34.55%, 79.39% 90.45%, 20.61% 90.45%, 2.45% 34.55%)",color:palette[i%4]};
  });
}
const dodePanels=dodecaPanels();
// First-frame exports of the six complete authored FACE sprites, not body parts.
// Extraction recipe and source references live beside the textures.
const artCube=[27,57,87,113,136,160].map((id,i):Panel=>({transform:["rotateY(90deg)","rotateY(-90deg)","rotateX(-90deg)","rotateX(90deg)","","rotateY(180deg)"][i]+" translateZ(75px)",image:`spatial/cube-faces/DefineSprite_${id}/1.png`,color:["#00cc00","#33cccc","#3399ff","#ff0099","#ff66ff","#ffff66"][i]}));

export function Companion({activityId,locale,reducedMotion,embedded=false,active=true}:ActivityProps) {
  const dode=activityId==="spatial-dodecahedron",isOcta=activityId==="spatial-octahedron";
  const panels=dode?dodePanels:artCube;
  const [playing,setPlaying]=useState(!reducedMotion),[angle,setAngle]=useState(25),[tilt,setTilt]=useState(-20),[roll,setRoll]=useState(0);
  useEffect(()=>{if(reducedMotion)setPlaying(false);},[reducedMotion]);
  const solid=useRef<HTMLDivElement>(null),phase=useRef(0);
  const octaAngles=useRef({turn:angle,tilt});
  useAnimation(delta=>{
    phase.current+=delta*24;
    if(solid.current)solid.current.style.transform=`rotateX(${tilt-phase.current}deg) rotateY(${angle-phase.current*(dode?1:.5)}deg) rotateZ(${roll-phase.current*(dode?1:1.5)}deg)`;
  },playing&&active&&!isOcta);
  const manual=(value:number,vertical=false)=>{setPlaying(false);if(vertical)setTilt(value);else setAngle(value);phase.current=0;};
  const rotation=useDragRotation(angle,tilt,(turn,pitch)=>{
    setPlaying(false);phase.current=0;
    setAngle(((turn+180)%360+360)%360-180);setTilt(((pitch+180)%360+360)%360-180);
  },isOcta?()=>octaAngles.current:()=>{
    const angles={turn:angle-phase.current*(dode?1:.5),tilt:tilt-phase.current};
    setRoll(roll-phase.current*(dode?1:1.5));
    return angles;
  });
  const label=t(locale,dode?"Twelve portrait faces of a dodecahedron":isOcta?"Eight triangular faces of an octahedron":"A cube with recovered illustrated face artwork",dode?"Двенадцать граней додекаэдра с портретами":isOcta?"Восемь треугольных граней октаэдра":"Куб с восстановленными иллюстрациями");
  return <div className={`activity-layout spatial-activity${embedded?" spatial-companion-embedded":""}`}>
    {!embedded&&<p className="explanation">{t(locale,"Pause to inspect the artwork, or turn the solid manually.","Остановите вращение для осмотра рисунков или поверните многогранник вручную.")}</p>}
    {isOcta?<div className="spatial-drag-rotate" {...rotation}><Octahedron playing={playing&&active} turn={angle} tilt={tilt} label={label} onViewAngles={(turn,pitch)=>{octaAngles.current.turn=turn;octaAngles.current.tilt=pitch;}}/></div>:<div className="spatial-companion-viewport spatial-drag-rotate" role="img" aria-label={label} {...rotation}>
      <div ref={solid} className="spatial-companion-solid" style={{transform:`rotateX(${tilt}deg) rotateY(${angle}deg) rotateZ(${roll}deg)`}}>
        {panels.map((p,i)=><div className="spatial-companion-face" key={i} style={{transform:p.transform,clipPath:p.clip,background:p.color} as CSSProperties}>{p.image&&<img src={mediaUrl(p.image)} alt="" draggable={false}/>}</div>)}
      </div>
    </div>}
    <div className="controls"><button className={embedded?"button-secondary spatial-companion-pause":"button"} aria-label={playing?t(locale,"Pause rotation","Остановить вращение"):t(locale,"Resume rotation","Продолжить вращение")} onClick={()=>setPlaying(!playing)}>{embedded?(playing?"Ⅱ":"▶"):(playing?t(locale,"Pause","Пауза"):t(locale,"Rotate automatically","Вращать автоматически"))}</button>{!embedded&&<><label className="control">{t(locale,"Turn","Поворот")}<input type="range" min="-180" max="180" value={angle} onChange={e=>manual(Number(e.target.value))}/></label><label className="control">{t(locale,"Tilt","Наклон")}<input type="range" min="-180" max="180" value={tilt} onChange={e=>manual(Number(e.target.value),true)}/></label></>}</div>
    {!embedded&&<p className="activity-note">{t(locale,dode?"Twelve portraits, one on each pentagonal face.":isOcta?"Eight triangular faces marked −1, e, π and i.":"The cube rotates while the illustrations on its faces stay still.",dode?"Двенадцать портретов, по одному на каждой пятиугольной грани.":isOcta?"Восемь треугольных граней с символами −1, e, π и i.":"Куб вращается, а рисунки на его гранях остаются неподвижными.")}</p>}
  </div>;
}
