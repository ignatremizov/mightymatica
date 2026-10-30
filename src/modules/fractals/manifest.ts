import type { ActivityMeta } from "../../shared/contracts";

export const manifest: ActivityMeta[] = [
  { id: "fractals-carpet", title: "The Sierpiński carpet", titleRu: "Ковёр Серпинского", description: "Remove the central ninth again and again. What happens to the area?", descriptionRu: "Снова и снова удаляйте центральную девятую часть. Что происходит с площадью?", category: "visual-math", sources: ["Movies/Serp-carp-intr.swf"], fidelity: "adaptation" },
  { id: "fractals-buffon", title: "Buffon’s needle", titleRu: "Игла Бюффона", description: "Drop needles across parallel lines and estimate π from their crossings.", descriptionRu: "Бросайте иглы на параллельные линии и оценивайте π по пересечениям.", category: "visual-math", sources: ["Movies/byufon.swf", "Movies/byufon-ru.swf", "Movies/byufon-exp.swf", "Movies/byufon-exp-ru.swf"], fidelity: "adaptation" },
  { id: "fractals-mobius-face", title: "A face on a Möbius strip", titleRu: "Лицо на ленте Мёбиуса", description: "Carry a marked face around a half-twisted strip and watch its orientation reverse.", descriptionRu: "Проведите лицо с отметкой по ленте с полуповоротом и исследуйте смену ориентации.", category: "spatial", sources: ["Movies/Moebius and face.swf"], fidelity: "adaptation" },
];
