import type { ActivityMeta } from "../../shared/contracts";

export const manifest: ActivityMeta[] = [
  {
    id: "logic-complete-chain", title: "Complete the chain", titleRu: "Продолжите цепочку",
    description: "Which bead comes next? Complete six repeating color patterns.",
    descriptionRu: "Какая бусина следующая? Дополните шесть повторяющихся цветных узоров.",
    category: "puzzles", sources: ["Movies/Completechain.swf"], fidelity: "adaptation",
  },
  {
    id: "logic-necklace", title: "Beads on a rope", titleRu: "Бусы на нитке",
    description: "Find six beads of the same shape in each of eight arrangements.",
    descriptionRu: "Найдите шесть бусин одинаковой формы в каждом из восьми заданий.",
    category: "puzzles", sources: ["Movies/Necklace.swf"], fidelity: "adaptation",
  },
  {
    id: "logic-ripped-necklace", title: "The ripped necklaces", titleRu: "Разорванные бусы",
    description: "Match the broken necklaces by the order of their beads. Three puzzles with shapes and colors.",
    descriptionRu: "Соедините разорванные бусы по порядку бусин. Три задания с формами и цветами.",
    category: "puzzles", sources: ["Movies/Rippednecklace.swf"], fidelity: "adaptation",
  },
  {
    id: "logic-count-stones", title: "Count the stones", titleRu: "Сосчитайте камни",
    description: "Count the stones in twenty-nine arrangements across three levels.",
    descriptionRu: "Сосчитайте камни в двадцати девяти заданиях трёх уровней.",
    category: "puzzles", sources: ["Movies/Stones.swf"], fidelity: "adaptation",
  },
  {
    id: "logic-coins-to-move",
    title: "Turn the coin pyramid",
    titleRu: "Переверните пирамиду",
    description: "Move just three of ten coins to turn the triangle upside down.",
    descriptionRu: "Переместите всего три из десяти монет, чтобы перевернуть треугольник.",
    category: "puzzles",
    sources: ["Movies/Coinstomove.swf", "Movies/Coinstomove-ru.swf"],
    fidelity: "adaptation",
  },
  {
    id: "logic-three-wisemen",
    title: "Three wisemen",
    titleRu: "Три мудреца",
    description: "Three soot-covered travelers laugh at one another. What can each infer?",
    descriptionRu: "Три испачканных сажей путешественника смеются друг над другом. Что можно заключить?",
    category: "puzzles",
    sources: ["Movies/Wisemen.swf", "Movies/Wisemen-ru.swf"],
    fidelity: "adaptation",
  },
  {
    id: "logic-eight-wisemen",
    title: "Wisemen at the train stops",
    titleRu: "Мудрецы на станциях",
    description: "A public announcement turns observation into shared knowledge. Predict when the travelers wash.",
    descriptionRu: "Объявление превращает наблюдения в общее знание. На какой станции мудрецы умоются?",
    category: "puzzles",
    sources: ["Movies/Wisemen 8.swf", "Movies/Wisemen 8-ru.swf"],
    fidelity: "adaptation",
  },
];
