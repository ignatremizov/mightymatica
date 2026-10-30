import type { ActivityMeta } from "../../shared/contracts";
import { lessons } from "./content";
import paradoxScenes from "./paradox-scenes.json";
export const manifest: ActivityMeta[] = [...lessons.map((lesson): ActivityMeta => ({
  id: `reasoning-${lesson.key}`, title: lesson.title[0], titleRu: lesson.title[1],
  description: lesson.question[0], descriptionRu: lesson.question[1],
  category: "puzzles", sources: lesson.sources.map(name => `Movies/${name}.swf`),
  fidelity: "adaptation",
})), ...paradoxScenes.map((scene): ActivityMeta => ({
  id: `reasoning-paradox-${scene.key}`, title: scene.title[0], titleRu: scene.title[1],
  description: `${scene.title[0]}. Follow the cuts and rearrangements one step at a time.`,
  descriptionRu: `${scene.title[1]}. Разрезы и перестановки показаны по шагам.`,
  category: "visual-math", sources: ["Movies/Paradox box.swf", "Movies/Paradox box-ru.swf"],
  fidelity: "adaptation", thumbnail: `reasoning/paradox-box/${scene.first}.webp`,
}))];
