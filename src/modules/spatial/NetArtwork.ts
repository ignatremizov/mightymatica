import art from "../../content/spatial-net-art.json";
import { mediaUrl } from "../../shared/contracts";

export interface NetFaceArtwork {
  src: string;
  origin: { x: number; y: number };
  bounds: { width: number; height: number };
}
const stages = art as Record<string, Record<string, NetFaceArtwork>>;
// Number identities used by the mathematical checker map to source T instances.
const faceNames = ["T4","T6","T3","T1","T5","T2"];
export function rearrangeArtwork(stage: number): NetFaceArtwork[] {
  return faceNames.map(name => stages[`Cubenetslide-${stage+1}`][name]);
}
export function choiceArtwork(stage: number): NetFaceArtwork[] {
  const entries=stages[`CubeNG-${stage+1}`];
  const result:NetFaceArtwork[]=[];
  for(const [name,face] of Object.entries(entries)) {
    const id=Number(name.replace("Symbol_",""));
    result[id-1]=face;
  }
  return result;
}
export function netFaceUrl(face: NetFaceArtwork): string {
  return mediaUrl(face.src.replace(/^media\//,""));
}
