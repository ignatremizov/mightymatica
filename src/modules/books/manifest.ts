import type { ActivityMeta } from "../../shared/contracts";

// Catalog-only data. The page inventory and hashes belong to the lazy reader.
const books: [key: string, title: string, titleRu: string, count: number][] = [
  ["MM-SAT-101-f", "SAT mathematics workbook", "Сборник задач SAT", 28],
  ["MMCircles", "Mathematical circles", "Математические кружки", 28],
  ["Mathbook-SATsubstit", "SAT mathematics · Substitution", "Математика для SAT · Подстановка", 5],
  ["MMGrade-1-3", "Mathematics · Grade 1, part 3", "Математика · 1 класс, часть 3", 92],
  ["Mightymatica-1-1", "Mightymatica · Grade 1, part 1", "Mightymatica · 1 класс, часть 1", 65],
  ["Mightymatica-1-2", "Mightymatica · Grade 1, part 2", "Mightymatica · 1 класс, часть 2", 65],
  ["Mightymatica-2-1", "Mightymatica · Grade 2, part 1", "Mightymatica · 2 класс, часть 1", 81],
];

export const manifest: ActivityMeta[] = books
  .map(([key, title, titleRu, count]) => ({
    id: `books-${key.toLowerCase()}`,
    title,
    titleRu,
    description: `${count} scanned pages, including the title page. The pages can be enlarged for reading.`,
    descriptionRu: `${count} сканированных страниц, включая титульную. Страницы можно увеличивать для чтения.`,
    category: "books",
    sources: [`Movies/${key}.swf`],
    fidelity: "reader",
    thumbnail: `books/${key}/page-001.jpg`,
  }));
