import type { ActivityMeta } from "../../shared/contracts";

export const manifest: ActivityMeta[] = [
  {
    id: "quiz-permutations",
    title: "Math Olympics: Permutations",
    titleRu: "Математическая олимпиада: перестановки",
    description: "Fifteen multiple-choice questions on counting and permutations. Notes explain errors in the original questions.",
    category: "puzzles",
    sources: ["Mil-perm-2.swf", "setup.xml"],
    fidelity: "adaptation",
  },
  {
    id: "quiz-permutations-more",
    title: "Math Olympics: More Permutations",
    titleRu: "Математическая олимпиада: ещё перестановки",
    description: "Fifteen more counting questions about doors, safe codes, and circular arrangements.",
    category: "puzzles",
    sources: ["Millionaire-Perm-more/millionaire.swf", "Millionaire-Perm-more/setup.xml"],
    fidelity: "adaptation",
  },
];
