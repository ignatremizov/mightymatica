import type { ActivityMeta } from "../../shared/contracts";
import films from "../../content/films.json";

const descriptions: Record<string, [string, string]> = {
  Pinoc1: ["A cartoon from the Pinocchio picture puzzle.", "Мультфильм из игры с картинкой о Буратино."],
  Prosto5: ["A cartoon from the Prostokvashino picture puzzle.", "Мультфильм из игры с картинкой о Простоквашино."],
  "Snowpart-0": ["The introduction to the Snow White picture puzzle.", "Вступление к игре с картинкой о Белоснежке."],
  "Snowpart-2": ["The cartoon shown after completing the Snow White picture.", "Мультфильм, который показывался после сборки картинки с Белоснежкой."],
  Funnymathmult: ["A short film about multiplication.", "Короткий фильм об умножении."],
  "Conic-6x4-f": ["A plane cuts a cone to form different curves.", "Плоскость пересекает конус, образуя разные кривые."],
  "cubesec6x4-f": ["The shapes formed when a plane cuts a cube.", "Фигуры, возникающие при пересечении куба плоскостью."],
  Moeb7: ["Ants follow the surface of a Möbius strip.", "Муравьи движутся по поверхности ленты Мёбиуса."],
  Cubesections: ["Watch how a cube's cross-section changes as the cutting plane moves.", "Посмотрите, как меняется сечение куба при движении секущей плоскости."],
};

export const manifest: ActivityMeta[] = films.map(film => ({
  id: `films-${film.key.toLowerCase()}`,
  title: film.title.replace(/ · (?:external )?original (?:film|cartoon)$/, ""),
  description: descriptions[film.key][0],
  descriptionRu: descriptions[film.key][1],
  category: "visual-math",
  sources: [film.source],
  fidelity: "native",
}));
