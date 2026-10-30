import type { ActivityMeta } from "../../shared/contracts";
import { timelines } from "./timelines";

export const artworks = [
  ["BandF", "Birds and fish", "Птицы и рыбы"],
  ["faces", "Faces", "Лица"],
  ["hands", "Drawing hands", "Рисующие руки"],
  ["lizards", "Reptiles", "Рептилии"],
  ["stairbig", "Impossible stairways", "Невозможные лестницы"],
  ["stairs", "Stairs", "Лестницы"],
  ["waterfall", "Waterfall", "Водопад"],
] as const;

export const manifest: ActivityMeta[] = [
  ...timelines.map((timeline): ActivityMeta => ({
    id: timeline.id,
    title: timeline.title,
    titleRu: timeline.titleRu,
    description: "A looping animation of Escher’s artwork.",
    descriptionRu: "Зацикленная анимация по картине Эшера.",
    category: "puzzles",
    sources: [`Movies/${timeline.source}.swf`],
    fidelity: "native",
    thumbnail: `escher/timelines/${timeline.source}/1.png`,
  })),
  {
    id: "escher-sliding-4",
    title: "Sliding tiles",
    titleRu: "Пятнашки",
    description: "Slide neighboring tiles into the empty space to restore numerical order.",
    descriptionRu: "Передвигайте соседние плитки на пустое место, восстанавливая порядок чисел.",
    category: "puzzles",
    sources: ["Movies/Sliding-4.swf"],
    fidelity: "adaptation",
  },
  ...artworks.map(([key, title, titleRu]): ActivityMeta => ({
    id: `escher-${key.toLowerCase()}`,
    title: `Escher: ${title}`,
    titleRu: `Эшер: ${titleRu}`,
    description: `Assemble Escher's “${title}” from nine pieces. Matching pieces join and move together.`,
    descriptionRu: `Соберите картину Эшера «${titleRu}» из девяти частей. Подходящие части соединяются и двигаются вместе.`,
    category: "puzzles",
    sources: [`Movies/Escher-${key}-game.swf`],
    fidelity: "adaptation",
    thumbnail: `escher/${key}/0.jpg`,
  })),
];
