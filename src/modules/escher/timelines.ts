export interface Timeline {
  source: string;
  frames: number;
  fps: number;
  start?: number;
}

export const timelines = [
  { id: "escher-ball-animation", title: "Escher: reflecting sphere", titleRu: "Эшер: отражающая сфера", source: "Escher-ball", frames: 80, fps: 24 },
  { id: "escher-reptiles-animation", title: "Escher: animated reptiles", titleRu: "Эшер: ожившие рептилии", source: "Escher-reptilies", frames: 60, fps: 24 },
  { id: "escher-stairways-animation", title: "Escher: animated stairways", titleRu: "Эшер: ожившие лестницы", source: "Escher-stairsbig", frames: 140, fps: 24 },
  { id: "escher-hands-animation", title: "Escher: animated hands", titleRu: "Эшер: ожившие руки", source: "Hands-escher", frames: 60, fps: 24 },
  { id: "escher-birdfish-animation", title: "Escher: birds and fish animation", titleRu: "Эшер: анимация птиц и рыб", source: "Birdfish-e", frames: 80, fps: 24 },
] as const;
