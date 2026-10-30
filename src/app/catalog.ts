import type { CategoryId, Locale } from "../shared/contracts";

export const categories: { id: CategoryId; en: string; ru: string; mark: string; note: string }[] = [
  { id: "geometry", en: "Geometry", ru: "Геометрия", mark: "△", note: "Triangles, circles, areas, and geometric proofs." },
  { id: "puzzles", en: "Puzzles & games", ru: "Игры и головоломки", mark: "♞", note: "Counting problems, logic puzzles, and picture games." },
  { id: "magic", en: "Math tricks & mazes", ru: "Фокусы и лабиринты", mark: "✧", note: "Number tricks, mouse mazes, and two hourglasses." },
  { id: "visual-math", en: "Visual math", ru: "Наглядная математика", mark: "∞", note: "Algebra in pictures, rolling coins, and mathematical films." },
  { id: "spatial", en: "Shapes & space", ru: "Фигуры и пространство", mark: "◇", note: "Cube nets, cross-sections, and coloring solids." },
  { id: "calculus", en: "Graphs & calculus", ru: "Графики и анализ", mark: "∫", note: "Function graphs, slopes, and areas under curves." },
  { id: "kids", en: "For children", ru: "Для детей", mark: "○", note: "Shapes, colors, patterns, and cartoon picture puzzles." },
  { id: "books", en: "Books", ru: "Книги", mark: "▤", note: "Illustrated mathematics books and SAT workbooks." },
];

export function categoryName(id: CategoryId, locale: Locale): string {
  const category = categories.find((item) => item.id === id);
  return category ? category[locale] : id;
}

export interface LegacyArtifact {
  source: string;
  title: string;
  sha256: string;
  width: number;
  height: number;
  pages: string[];
  kind: "activity" | "support" | "book" | "media";
  thumbnail?: string;
}
