/** Global one-based source stops, including the second scene's 1440-frame offset. */
export const circleQuestionFrames = {
  en: [1604, 1677, 1749, 1821, 1893, 1965, 2037, 2109],
  ru: [1622, 1696, 1769, 1841, 1913, 1984, 2055, 2128],
} as const;
const correctFrames = [1627, 1700, 1772, 1844, 1916, 1988, 2060, 2132] as const;
const wrongFrames = [1626, 1699, 1771, 1843, 1915, 1987, 2059, 2131] as const;

export function circleLessonBranch(locale: "en" | "ru", question: number, correct: boolean) {
  if (!Number.isInteger(question) || question < 0 || question >= 8) throw new RangeError("Unknown circle question.");
  return correct
    ? { start: correctFrames[question]!, end: circleQuestionFrames[locale][question + 1] ?? (locale === "en" ? 2178 : 2229) }
    : { start: circleQuestionFrames[locale][question]! + 1, end: wrongFrames[question]! };
}
