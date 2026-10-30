import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "../../shared/contracts";

type Effect = "move" | "wrong" | "correct" | "complete";
const files: Record<Effect, string> = {
  move:"Shortbang.mp3",wrong:"AngryMob.mp3",correct:"Congrats.mp3",complete:"salut.MP3",
};

/** Source feedback only: enabled by default, but created/played only by an interaction. */
export function useSourceAudio() {
  const [enabled,setEnabled]=useState(true);
  const [failed,setFailed]=useState(false);
  const clips=useRef(new Map<Effect,HTMLAudioElement>());
  const generation=useRef(0),mounted=useRef(true);
  const stop=()=>{
    generation.current++;
    for(const clip of clips.current.values()){clip.pause();clip.currentTime=0;}
  };
  useEffect(()=>{
    mounted.current=true;
    return ()=>{
      mounted.current=false;generation.current++;
      for(const clip of clips.current.values()){clip.pause();clip.removeAttribute("src");clip.load();}
      clips.current.clear();
    };
  },[]);
  const toggle=(value:boolean)=>{setEnabled(value);setFailed(false);if(!value)stop();};
  const play=(effect:Effect)=>{
    if(!enabled)return;
    let clip=clips.current.get(effect);
    if(!clip){
      clip=new Audio(mediaUrl(`spatial/audio/effects/${files[effect]}`));
      clip.volume=.4;clips.current.set(effect,clip);
    }
    clip.currentTime=0;
    const ticket=generation.current;
    void clip.play().catch(()=>{if(mounted.current&&ticket===generation.current)setFailed(true);});
  };
  return {enabled,toggle,play,stop,failed};
}
