import { useEffect, useRef, useState } from "react";
import { t } from "../../shared/contracts";
import type { Locale } from "../../shared/contracts";
import { LessonAudio } from "../../shared/LessonAudio";
import { useAnimation } from "../../shared/useAnimation";
import source from "../../../public/media/spatial/audio/pair-en/audio.json";

/** Source stage-entry event, retaining its trim and independent stereo gains. */
export default function PairStageAudio({stage,locale}:{stage:number;locale:Locale}) {
  const owner=useRef<LessonAudio|null>(null),elapsed=useRef(0),operation=useRef(0);
  const [playing,setPlaying]=useState(false),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false);
  const frame=[36,96,156,216][stage];
  useEffect(()=>{
    const audio=new LessonAudio({...source,initialFrame:frame,endFrame:frame,chapters:[],stops:[],
      audioCues:source.audioCues.filter(cue=>cue.frame===frame)},()=>setFailed(true));
    owner.current=audio;audio.reset(frame);elapsed.current=0;setPlaying(false);setLoading(false);
    return ()=>{operation.current++;audio.dispose();if(owner.current===audio)owner.current=null;};
  },[frame]);
  useAnimation(delta=>{
    elapsed.current+=delta;
    owner.current?.sync(elapsed.current,true);
    if(!owner.current?.activeCount)setPlaying(false);
  },playing&&!loading,{preserveElapsed:true});
  const pause=()=>{operation.current++;owner.current?.pause();setPlaying(false);setLoading(false);};
  const play=async()=>{
    const audio=owner.current;
    if(!audio)return;
    const request=++operation.current;
    if(!audio.activeCount){elapsed.current=0;audio.reset(frame);}
    setLoading(true);setFailed(false);
    try{
      audio.retry();await audio.activate();await audio.prepareRange(frame,frame);
      if(request===operation.current&&audio===owner.current){setLoading(false);setPlaying(true);}
    }catch{
      if(request===operation.current){setFailed(true);setLoading(false);}
    }
  };
  return <div className="controls"><button type="button" className="button-secondary" disabled={loading}
    onClick={()=>{if(playing)pause();else void play();}}>
    {t(locale,loading?"Loading stage audio…":playing?"Pause stage audio":"Play stage audio",loading?"Загрузка звука этапа…":playing?"Остановить звук этапа":"Воспроизвести звук этапа")}
  </button>{failed&&<span role="status">{t(locale,"Audio could not play. Try again.","Не удалось воспроизвести звук. Повторите попытку.")}</span>}</div>;
}
