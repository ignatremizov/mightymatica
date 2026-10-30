import type { ActivityMeta } from "../../shared/contracts";

const lessons = [
  ["false-proof", "Are all triangles isosceles?", "Все треугольники равнобедренные?", "A geometric argument seems to prove that any triangle has two equal sides. Where does it go wrong?", "Геометрическое рассуждение будто бы доказывает, что у любого треугольника две стороны равны. Где ошибка?", ["Alltriangles", "Alltriangles-ru"]],
  ["congruence", "Triangle congruence", "Равенство треугольников", "Which sides and angles determine a triangle? Compare the three congruence criteria by superposing triangles.", "Какие стороны и углы определяют треугольник? Сравните три признака равенства, накладывая треугольники друг на друга.", ["Congruence", "Congruence-ru"]],
  ["pythagoras", "Pythagorean theorem", "Теорема Пифагора", "Change the legs and compare the three square areas.", "Изменяйте катеты и сравнивайте площади квадратов.", ["Pifagor-gl", "Pifagoras Theorem - ru"]],
  ["medians", "Medians and the centroid", "Медианы и центр тяжести", "Move the vertices: six equal areas and a 2:1 division.", "Двигайте вершины: шесть равных площадей и отношение 2:1.", ["Mediana", "Mediana-ru"]],
  ["altitudes", "Altitudes and the orthocenter", "Высоты и ортоцентр", "Where do the three altitudes meet as a triangle changes from acute to obtuse?", "Где пересекаются три высоты, когда остроугольный треугольник становится тупоугольным?", ["Altitudes", "Altitudes-ru"]],
  ["bisectors", "Angle bisectors", "Биссектрисы", "Find the incenter and test the angle-bisector ratio.", "Найдите центр вписанной окружности и отношение отрезков.", ["Bisector", "Bisector-ru"]],
  ["cosine-law", "Law of cosines", "Теорема косинусов", "Move a triangle and inspect its coordinate proof.", "Изменяйте треугольник и исследуйте координатное доказательство.", ["Coslaw", "Coslaw-ru"]],
  ["sine-law", "Law of sines", "Теорема синусов", "Each side divided by the sine of its opposite angle gives the same ratio. Check it as the triangle changes.", "Отношения сторон к синусам противолежащих углов равны. Проверьте это, меняя треугольник.", ["Sinlaw", "Sinlaw-ru"]],
  ["inscribed-angle", "Inscribed angle theorem", "Теорема о вписанном угле", "Move a point around a circle without changing the intercepted arc.", "Двигайте точку по окружности, сохраняя дугу.", ["Insangle", "Insangle-ru"]],
  ["trig-addition", "Trigonometric addition", "Синус и косинус суммы", "Compose two rotations and inspect both addition identities.", "Сложите два поворота и исследуйте формулы сложения.", ["Trig-cos", "Trig-cos-ru"]],
  ["palm-trig", "Trigonometry on your fingers", "Тригонометрия на пальцах", "Choose a finger to recover exact unit-circle coordinates.", "Выберите палец, чтобы найти точные значения синуса и косинуса.", ["Palmandtrig"]],
] as const;
export const manifest: ActivityMeta[] = lessons.map(([id, title, titleRu, description, descriptionRu, sources]) => ({
  id: `triangles-${id}`, title, titleRu, description, descriptionRu, category: "geometry",
  sources: sources.map(source => `Movies/${source}.swf`), fidelity: "adaptation",
}));
