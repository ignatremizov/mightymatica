import type { ActivityMeta } from "../../shared/contracts";

export const manifest: ActivityMeta[] = [
  {
    id: "measurement-area", title: "Measuring area", titleRu: "Измеряем площадь",
    description: "Count unit squares, then compare rectangles, parallelograms and trapezoids.",
    descriptionRu: "Считайте единичные квадраты и исследуйте площади прямоугольника, параллелограмма и трапеции.",
    category: "geometry", sources: ["Movies/Area.swf", "Movies/Area-ru.swf"], fidelity: "adaptation",
  },
  {
    id: "measurement-polygon", title: "Area of a regular polygon", titleRu: "Площадь правильного многоугольника",
    description: "Equal triangles turn a regular polygon's perimeter and apothem into its area: A = Ph/2.",
    descriptionRu: "Разбейте правильный многоугольник на равные треугольники и получите S = Ph/2.",
    category: "geometry", sources: ["Movies/Area of polygon.swf", "Movies/Area of polygon-ru.swf"], fidelity: "adaptation",
  },
  {
    id: "measurement-circle", title: "From polygons to circles", titleRu: "От многоугольника к кругу",
    description: "As an inscribed polygon gains sides, its perimeter and area approach those of the circle.",
    descriptionRu: "При увеличении числа сторон периметр и площадь вписанного многоугольника приближаются к длине окружности и площади круга.",
    category: "geometry", sources: ["Movies/Circle.swf", "Movies/Circle-ru.swf"], fidelity: "adaptation",
  },
];
