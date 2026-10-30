import { useEffect, useState } from "react";
import siteDesign from "../content/site-design.json";
import sourcePreviews from "../content/previews.json";
import { activityThumbnail } from "./activityThumbnail";
import { mediaUrl, t, type Locale } from "../shared/contracts";
import { activities, type ActivityEntry } from "./registry";
import type { LegacyArtifact } from "./catalog";
import { OriginalPageLayout, type OriginalLayoutNode } from "./OriginalPageLayout";
import { OriginalWordmark } from "../shared/OriginalWordmark";

interface SiteImage {
  src: string;
  width?: number;
  height?: number;
  stillSrc?: string;
}

interface OriginalLink {
  source: string;
  image?: string;
  hover?: string;
}

interface OriginalPage {
  title: string;
  leadImages: string[];
  links: OriginalLink[];
  sourceOrder?: string[];
  hasLayout?: boolean;
}

const images: Record<string, SiteImage> = siteDesign.assets;
const pages: Record<string, OriginalPage> = siteDesign.pages;

export const siteSections = [
  { id: "calculus", source: "Calculus.html", sourceRu: "Calculus-ru.html", title: "Calculus", titleRu: "Математический анализ" },
  { id: "books", source: "Books.html", title: "Books", titleRu: "Книги" },
  { id: "livegeometry", source: "Livegeometry.html", sourceRu: "Livegeometry-ru.html", title: "Live Geometry", titleRu: "Живая геометрия" },
  { id: "slidingpuzzles", source: "Slidingpuzzles.html", sourceRu: "Slidingpuzzlesru.html", title: "Sliding Puzzles", titleRu: "Пазлы и пятнашки" },
  { id: "kids", source: "For kids.html", title: "For Kids", titleRu: "Для детей" },
  { id: "magicmath", source: "Magicmath.html", sourceRu: "Magicmath-ru.html", title: "Magic of Math", titleRu: "Магия математики" },
  { id: "funnymath", source: "Funnylmath.html", title: "Funny Math", titleRu: "Занимательная математика" },
  { id: "playmath", source: "Playmath.html", title: "Play Math", titleRu: "Математические игры" },
  { id: "visualmath", source: "Visualmath-n.html", sourceRu: "Visualmath-n-ru.html", title: "Visual Math", titleRu: "Наглядная математика" },
  { id: "mathsat", source: "Mathsat.html", title: "Math SAT", titleRu: "Математика для SAT" },
] as const;

export type SiteSectionId = typeof siteSections[number]["id"];

export function isSiteSection(value: string): value is SiteSectionId {
  return siteSections.some((section) => section.id === value);
}

export function siteSectionTitle(id: SiteSectionId, locale: Locale): string {
  const section = siteSections.find((item) => item.id === id)!;
  return t(locale, section.title, section.titleRu);
}

/** Keep original image proportions and rollovers; the modern controls stay semantic. */
export function OriginalImage({
  source, hover, alt = "", reducedMotion, className, eager = false, width, height,
}: {
  source: string;
  hover?: string;
  alt?: string;
  reducedMotion: boolean;
  className?: string;
  eager?: boolean;
  width?: number;
  height?: number;
}) {
  const [over, setOver] = useState(false);
  const asset = images[over && hover && images[hover] ? hover : source];
  if (!asset) return alt ? <span>{alt}</span> : null;
  return <img
    className={className}
    src={mediaUrl(reducedMotion && asset.stillSrc ? asset.stillSrc : asset.src)}
    width={width ?? images[source]?.width ?? asset.width}
    height={height ?? images[source]?.height ?? asset.height}
    alt={alt}
    loading={eager ? "eager" : "lazy"}
    onPointerEnter={hover ? (event) => { if (event.pointerType !== "touch") setOver(true); } : undefined}
    onPointerLeave={hover ? () => setOver(false) : undefined}
    onPointerCancel={hover ? () => setOver(false) : undefined}
  />;
}

export function OriginalHeader({
  locale, reducedMotion, currentSection, home, onLocale,
}: {
  locale: Locale;
  reducedMotion: boolean;
  currentSection?: SiteSectionId;
  home: boolean;
  onLocale: (locale: Locale) => void;
}) {
  return <header className="original-header">
    <div className="original-masthead">
      <a className="original-banner original-banner-name" href="#/" aria-label="MightyMatica">
        <span className="sr-only">MIGHTYMATICA</span>
        <OriginalWordmark kind="mightymatica" reducedMotion={reducedMotion} />
      </a>
      <a className="original-logo" href="#/" aria-label={t(locale, "Home", "Главная")}>
        <OriginalImage source={siteDesign.logo} alt="MightyMatica" reducedMotion={reducedMotion} eager />
      </a>
      <div className="original-banner original-banner-academy">
        <span className="sr-only">THINKING ACADEMY</span>
        <OriginalWordmark kind="thinking-academy" reducedMotion={reducedMotion} />
      </div>
    </div>
    <OriginalImage source={siteDesign.divider} reducedMotion={reducedMotion} className="original-divider" eager />
    <nav className={`original-navigation${locale === "ru" ? " original-navigation-russian" : ""}`} aria-label={t(locale, "Main navigation", "Главное меню")}>
      {siteDesign.navigation.filter((item) => home ? item.id !== "home" : item.id !== "calculus").map((item) => {
        const section = siteSections.find(({ source }) => source === item.page);
        const href = item.id === "home" ? "#/" : item.id === "contact" ? "#/contact" : section ? `#/section/${section.id}` : "#/about";
        const label = section ? t(locale, section.title, section.titleRu) : t(locale, item.label, item.id === "home" ? "Главная" : "Контакты");
        return <a key={item.id} href={href} aria-current={currentSection !== undefined && currentSection === section?.id ? "page" : undefined}
          className={locale === "ru" ? "original-nav-russian" : undefined}>
          {locale === "en"
            ? <OriginalImage source={item.image} hover={item.hover} alt={label} reducedMotion={reducedMotion} eager />
            : label}
        </a>;
      })}
    </nav>
    <div className="original-language">
      <button type="button" onClick={() => onLocale(locale === "en" ? "ru" : "en")}
        aria-label={t(locale, "Переключить на русский", "Switch to English")}>
        <OriginalImage source={siteDesign.flags[locale === "en" ? "ru" : "en"]}
          alt={locale === "en" ? "Русский" : "English"} reducedMotion={reducedMotion} eager />
      </button>
    </div>
  </header>;
}

const polyhedronLinks = [
  "#/activity/coloring-tetrahedron",
  "#/activity/spatial-dodecahedron",
  "#/activity/spatial-eleven-nets",
  "#/collection/spatial",
];

export function OriginalHome({ locale, reducedMotion }: { locale: Locale; reducedMotion: boolean }) {
  const polyhedron = (index: number) => {
    const item = siteDesign.home.polyhedra[index];
    return <a href={polyhedronLinks[index]} key={item.image}>
      <OriginalImage source={item.image} hover={item.hover}
        alt={t(locale, ["Tetrahedron", "Dodecahedron", "Cube", "Icosahedron"][index], ["Тетраэдр", "Додекаэдр", "Куб", "Икосаэдр"][index])}
        reducedMotion={reducedMotion} eager />
    </a>;
  };
  return <section className="original-home">
    <h1 className="sr-only">MightyMatica · Thinking Academy</h1>
    <div className="original-home-art">
      <div className="original-solids">{polyhedron(0)}{polyhedron(1)}</div>
      <a href="#/activity/escher-stairways-animation" className="original-escher">
        <OriginalImage source={siteDesign.home.escher}
          alt={t(locale, "M. C. Escher’s stairways", "Лестницы М. К. Эшера")} reducedMotion={reducedMotion} eager />
      </a>
      <div className="original-solids">{polyhedron(2)}{polyhedron(3)}</div>
    </div>
    <OriginalRecommendations locale={locale} reducedMotion={reducedMotion} />
  </section>;
}

function OriginalRecommendations({ locale, reducedMotion }: { locale: Locale; reducedMotion: boolean }) {
  const links = [
    ["Images/Etudes.jpg", "Images/Etudes-over.jpg", "Mathematical Etudes", "https://www.etudes.ru/en/"],
    ["Images/Artofproblemsolving.jpg", "Images/Artofproblemsolving-over.jpg", "Art of Problem Solving", "https://artofproblemsolving.com/"],
    ["Images/collmath4kids.jpg", "Images/collmath4kids-over.jpg", "Coolmath4Kids", "https://www.coolmath4kids.com/"],
    ["Images/Mathisfun.jpg", "Images/Mathisfun-over.jpg", "Math is Fun", "https://www.mathsisfun.com/"],
    ["Images/Mathplaygroundlbl.jpg", "Images/Mathplaygroundlbl-over.jpg", "Math Playground", "https://www.mathplayground.com/"],
    ["Images/Intmath.jpg", "Images/Intmath-over.jpg", "Interactive Mathematics", "https://www.intmath.com/"],
    ["Images/Khanacademy.jpg", "Images/Khanacademy-over.jpg", "Khan Academy", "https://www.khanacademy.org/"],
  ];
  return <section className="original-recommendations">
    <h2>{t(locale, "Sites we recommend to visit:", "Сайты, которые мы рекомендуем посетить:")}</h2>
    <div>{links.map(([image, hover, label, href]) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">
      <OriginalImage source={image} hover={hover} alt={label} reducedMotion={reducedMotion} />
    </a>)}</div>
  </section>;
}

const intros: Partial<Record<SiteSectionId, [string, string]>> = {
  livegeometry: ["Mightymatica provides study of Geometry by observing Math objects in visual and interactive presentation.", "Изучайте геометрию, наблюдая математические объекты в наглядных и интерактивных представлениях."],
  magicmath: ["Mathematics helps to explain and understand a lot of phenomena. Even with pure simple arithmetic we can explain some mysteries.", "Математика помогает понять и объяснить многие явления. Даже простая арифметика позволяет разгадать некоторые тайны."],
  playmath: ["Math is the base for many games. Explore Math with pleasure.", "Математика лежит в основе многих игр. Изучайте её с удовольствием."],
  visualmath: ["Mightymatica provides study of Math by observing Math objects in visual and interactive presentation.", "Изучайте математику с помощью наглядных и интерактивных представлений."],
  mathsat: ["To pass the SAT math test, you need to solve problems.", "Чтобы подготовиться к математической части SAT, нужно решать задачи."],
};

/** Match the old section and source order, not the replacement shell's categories. */
export function OriginalSection({ id, locale, reducedMotion, activityReducedMotion }: { id: SiteSectionId; locale: Locale; reducedMotion: boolean; activityReducedMotion: boolean }) {
  const section = siteSections.find((item) => item.id === id)!;
  const source = locale === "ru" && "sourceRu" in section ? section.sourceRu : section.source;
  const page = pages[source] ?? pages[section.source];
  const [layouts, setLayouts] = useState<Record<string, OriginalLayoutNode[]> | null>(null);
  const [inventory, setInventory] = useState<LegacyArtifact[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    setFailed(false);
    if (page?.hasLayout) {
      void import("../content/site-layouts.json").then((module) => {
        if (!disposed) setLayouts(module.default as Record<string, OriginalLayoutNode[]>);
      }).catch(() => { if (!disposed) setFailed(true); });
    } else {
      void import("../content/legacy.json").then((module) => {
        if (!disposed) setInventory(module.default as LegacyArtifact[]);
      }).catch(() => { if (!disposed) setFailed(true); });
    }
    return () => { disposed = true; };
  }, [page?.hasLayout, source]);
  const layout = layouts?.[source] ?? layouts?.[section.source];
  const ordered: { activity: ActivityEntry; image?: string; hover?: string }[] = [];
  const included = new Set<string>();
  const include = (sourcePath: string, link?: OriginalLink) => {
    const activity = activities.find((entry) => entry.sources.includes(sourcePath));
    if (!activity || included.has(activity.id)) return;
    included.add(activity.id);
    ordered.push({ activity, image: link?.image, hover: link?.hover });
  };
  const links = new Map((page?.links ?? []).map((link) => [link.source, link]));
  for (const sourcePath of page?.sourceOrder ?? [...links.keys()]) include(sourcePath, links.get(sourcePath));
  for (const record of inventory ?? []) {
    if (record.pages.includes(source) || record.pages.includes(section.source)) include(record.source);
  }
  const intro = intros[id];
  return <section className={`original-section original-section-${id}`} aria-label={siteSectionTitle(id, locale)}>
    {page?.hasLayout ? layout
      ? <OriginalPageLayout nodes={layout} locale={locale} reducedMotion={reducedMotion} activityReducedMotion={activityReducedMotion}
          renderImage={(node, hover) => <OriginalImage source={node.image!} hover={hover}
            alt={node.label ?? ""} width={node.width} height={node.height} reducedMotion={reducedMotion} />} />
      : <p className="original-section-loading" role="status">{failed
          ? t(locale, "This page could not load. Please refresh to retry.", "Не удалось загрузить страницу. Обновите её и попробуйте снова.")
          : t(locale, "Loading…", "Загрузка…")}</p>
      : <><div className={page?.leadImages.length ? "original-section-heading original-heading-illustrated" : "original-section-heading"}>
      {!!page?.leadImages.length && <div className="original-section-illustration">
        {page.leadImages.map((image) => <OriginalImage key={image} source={image} reducedMotion={reducedMotion} eager />)}
      </div>}
      <h1>{siteSectionTitle(id, locale)}</h1>
    </div>
    {intro && <p className="original-section-intro">{t(locale, ...intro)}</p>}
    {!inventory && !failed && <p className="original-section-loading" role="status">{t(locale, "Opening the collection…", "Открываем коллекцию…")}</p>}
    {failed && <p role="status">{t(locale, "Some items could not load. Reload to see the complete section.", "Не все занятия загрузились. Обновите страницу, чтобы увидеть весь раздел.")}</p>}
    <div className="original-activity-grid">{ordered.map(({ activity, image, hover }) => {
      const thumbnail = activityThumbnail(activity, locale, sourcePreviews);
      const title = t(locale, activity.title, activity.titleRu);
      return <a key={activity.id} href={`#/activity/${activity.id}`} className="original-activity-link">
        {image && images[image]
          ? <OriginalImage source={image} hover={hover} alt={title} reducedMotion={reducedMotion} />
          : thumbnail ? <img src={mediaUrl(thumbnail)} alt={title} loading="lazy" /> : <span className="original-text-link">{title}</span>}
        {(image || thumbnail) && <span className="original-activity-caption">{title}</span>}
      </a>;
    })}</div></>}
    {inventory && !ordered.length && <p>{t(locale, "Browse the native activities in the complete collection.", "Откройте веб-занятия в полной коллекции.")}</p>}
  </section>;
}

export function OriginalContact({ locale }: { locale: Locale }) {
  return <section className="original-contact original-section">
    <div className="original-section-heading"><h1>{t(locale, "Contact", "Контакты")}</h1></div>
    <p>{t(locale, "MightyMatica was created by Yuri Remizov. This web edition is maintained by Ignat Remizov.", "MightyMatica создана Юрием Ремизовым. Веб-версию поддерживает Игнат Ремизов.")}</p>
    <p><a href="https://ignatremizov.com/">{t(locale, "Contact Ignat through his portfolio", "Связаться с Игнатом через его портфолио")}</a></p>
    <p><a href="#/about">{t(locale, "About this restoration and original credits", "О восстановлении и авторах оригинала")}</a></p>
  </section>;
}
