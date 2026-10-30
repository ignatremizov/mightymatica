import type { ActivityMeta } from "../../shared/contracts";

export const manifest: ActivityMeta[] = [
  {
    id: "stories-pinocchio",
    title: "Pinocchio picture puzzle",
    titleRu: "Картинка с Пиноккио",
    description: "A Pinocchio cartoon picture cut into nine pieces. Drag them together to assemble the scene.",
    descriptionRu: "Картинка с Пиноккио разрезана на девять частей. Соедините их, чтобы собрать сценку.",
    category: "kids",
    sources: ["Movies/Pinoc-game.swf", "Movies/Pinoc1.swf"],
    fidelity: "adaptation",
    thumbnail: "stories/Pinoc-game/36.jpg",
  },
  {
    id: "stories-prostokvashino",
    title: "Prostokvashino picture puzzle",
    titleRu: "Картинка из Простоквашино",
    description: "Nine pieces make a scene from Prostokvashino. Match the edges and picture details.",
    descriptionRu: "Из девяти частей получается сценка из Простоквашино. Сопоставьте края и детали рисунка.",
    category: "kids",
    sources: ["Movies/Prosto-game.swf", "Movies/Prosto5.swf"],
    fidelity: "adaptation",
    thumbnail: "stories/Prosto-game/36.jpg",
  },
  {
    id: "stories-snow-white",
    title: "Snow White picture puzzle",
    titleRu: "Картинка с Белоснежкой",
    description: "Put nine pieces together to complete the picture of the dwarfs.",
    descriptionRu: "Сложите девять частей, чтобы получилась картинка с гномами.",
    category: "kids",
    sources: ["Movies/Snowhite-game.swf", "Movies/Snowpart-0.swf", "Movies/Snowpart-2.swf"],
    fidelity: "adaptation",
    thumbnail: "stories/Snowhite-game/36.jpg",
  },
];
