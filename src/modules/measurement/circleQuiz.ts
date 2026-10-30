/** Source: Circle/Circle-ru texts 162–252 / 142–240; MainTimeline frames 1604–2109. */
export const circleQuiz = [
  { en: "Find the area of a circle with a diameter of 8 inches.", ru: "Найдите площадь круга с диаметром 8 см.", choices: ["40.26", "50.26", "60.26", "80.26"], correct: 1, why: "π × (8/2)² ≈ 50.26" },
  { en: "Find the diameter of a circle with an area of 200.96 square feet.", ru: "Найдите диаметр круга, у которого площадь 200.96 м².", choices: ["8", "12", "16", "20"], correct: 2, why: "2√(200.96/3.14) = 16" },
  { en: "If the area of the circle is 100 square feet, what is the circumference?", ru: "Если площадь круга равна 100 см², то какова длина окружности?", choices: ["20", "35.44", "40.22", "50"], correct: 1, why: "C = 2√(πA) ≈ 35.44" },
  { en: "Find the area of the shaded part (cm²). The rectangle is 8 cm × 12 cm; the circle has diameter 8 cm.", ru: "Найдите площадь тёмной части рисунка (см²). Прямоугольник 8 × 12 см; диаметр круга 8 см.", choices: ["26.46", "36.76", "56.36", "45.76"], correct: 3, why: "8 × 12 − 3.14 × 4² = 45.76", frame: "1821" },
  { en: "The radius increases by a factor of 4. By what factor does the area change?", ru: "Радиус круга увеличили в 4 раза, во сколько раз увеличилась площадь?", choices: ["2", "4", "16", "8"], correct: 2, why: "A = π(4r)² = 16πr²" },
  { en: "The circle's area is 100 cm². AC equals its radius. Find the area of triangle ABC.", ru: "Площадь круга 100 см². AC — радиус круга. Найдите площадь треугольника ABC.", choices: ["12.71", "9.71", "19.71", "29.71"], correct: 3, why: "AABC = r²(1 + √3/2)/2 ≈ 29.71 (π ≈ 3.14)", frame: "1965" },
  { en: "Find the area of a circle with circumference √π.", ru: "Найдите площадь круга с длиной окружности √π.", choices: ["π", "0.25", "0.25π", "0.5"], correct: 1, why: "A = C²/(4π) = 1/4" },
  { en: "The circle's area is 1/π cm². Find its circumference.", ru: "Площадь круга равна 1/π см². Найдите длину окружности.", choices: ["1 cm", "4 cm", "2 cm", "2π cm"], correct: 2, why: "r = 1/π; C = 2πr = 2 cm" },
] as const;

/** Wrong answers retry the same stage; completion is distinct from restarting. */
export function circleQuizNext(stage: number, answer: number): number {
  const question = circleQuiz[stage];
  return question && answer === question.correct ? stage + 1 : stage;
}

export function circleQuizDiagram(stage: number, locale: "en" | "ru"): string | null {
  if (stage !== 3 && stage !== 5) return null;
  return locale === "ru"
    ? `measurement/circle-quiz-ru/${stage === 3 ? 1841 : 1984}.svg`
    : `measurement/circle-quiz/${stage === 3 ? 1821 : 1965}.svg`;
}
