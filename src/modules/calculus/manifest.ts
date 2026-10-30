import type { ActivityMeta } from "../../shared/contracts";

const graphs = [
  ["linear", "Linear function", "Линейная функция", "y = ax + b"],
  ["square", "Quadratic function", "Квадратичная функция", "y = ax² + bx + c"],
  ["cubic", "Cubic function", "Кубическая функция", "y = ax³ + bx² + cx + d"],
  ["power", "Exponential function", "Показательная функция", "y = aˣ + b"],
  ["sine", "Sine function", "Синус", "y = A sin(ωx + φ)"],
  ["cosine", "Cosine function", "Косинус", "y = A cos(ωx + φ)"],
  ["tan", "Tangent function", "Тангенс", "y = A tan(ωx + φ)"],
  ["gaussian", "Gaussian distribution", "Распределение Гаусса", "p(x) = exp(−x² / 2σ²) / (σ√(2π))"],
  ["sinecosine", "Sine + cosine", "Синус + косинус", "y = A sin(ωx + φ) + B cos(νx + ψ)"],
] as const;

export const manifest: ActivityMeta[] = [
  { id: "calculus-graphintro", title: "Try functions", titleRu: "Исследуйте функции", description: "How does changing a coefficient change the graph? Compare several families of functions.", descriptionRu: "Как коэффициенты влияют на график? Сравните несколько видов функций.", category: "calculus", sources: ["Movies/Graphintro.swf"], fidelity: "adaptation" },
  ...graphs.map(([id, title, titleRu, formula]): ActivityMeta => ({
    id: `calculus-graph-${id}`, title, titleRu, description: `${formula}. Change the parameters and compare the resulting graphs.`, descriptionRu: `${formula}. Меняйте параметры и сравнивайте графики.`, category: "calculus", sources: [`Movies/Graph-${id}.swf`], fidelity: "adaptation",
  })),
  { id: "calculus-five-minutes", title: "Calculus: slope and accumulation", titleRu: "Матанализ: наклон и накопление", description: "What connects position and velocity? Secant lines and signed areas introduce derivatives and integrals.", descriptionRu: "Как связаны координата и скорость? Секущие и площади со знаком помогают понять производную и интеграл.", category: "calculus", sources: ["Movies/Calculus5min.swf", "Movies/Calculus5min-ru-mod.swf"], fidelity: "adaptation" },
];
