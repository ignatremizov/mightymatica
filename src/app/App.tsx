import {
  Component, Suspense, useEffect, useId, useRef, useState,
  type ErrorInfo, type ReactNode,
} from "react";
import { activities, getActivityComponent, type ActivityEntry } from "./registry";
import { categories, categoryName } from "./catalog";
import { usePreferences } from "./preferences";
import { mediaUrl, t, type CategoryId, type Locale } from "../shared/contracts";
import sourcePreviews from "../content/previews.json";
import { activityThumbnail } from "./activityThumbnail";
import siteDesign from "../content/site-design.json";
import { activityReturnRoute } from "./activityNavigation";
import {
  OriginalContact, OriginalHeader, OriginalHome, OriginalSection,
  isSiteSection, siteSections, siteSectionTitle, type SiteSectionId,
} from "./OriginalSite";

type Page =
  | { kind: "home" }
  | { kind: "collection"; category?: CategoryId }
  | { kind: "section"; id: SiteSectionId }
  | { kind: "activity"; id: string }
  | { kind: "about" }
  | { kind: "contact" }
  | { kind: "missing" };

function readPage(): Page {
  const path = location.hash.replace(/^#\/?/, "").split("/");
  try {
    if (!path[0]) return { kind: "home" };
    if (path[0] === "activity" && path.length === 2) return { kind: "activity", id: decodeURIComponent(path[1]) };
    if (path[0] === "section" && path.length === 2 && isSiteSection(path[1])) return { kind: "section", id: path[1] };
    if (path[0] === "collection" && path.length <= 2) {
      if (!path[1]) return { kind: "collection" };
      const category = categories.find(({ id }) => id === path[1])?.id;
      return category ? { kind: "collection", category } : { kind: "missing" };
    }
    if (path[0] === "sources" && path.length === 1) return { kind: "collection" };
    if (path[0] === "about" && path.length === 1) return { kind: "about" };
    if (path[0] === "contact" && path.length === 1) return { kind: "contact" };
  } catch { /* A malformed bookmark should still have a useful way home. */ }
  return { kind: "missing" };
}

function activityTitle(activity: ActivityEntry, locale: Locale) {
  return t(locale, activity.title, activity.titleRu);
}

function MathSketch({ category, large = false }: { category: CategoryId; large?: boolean }) {
  const patternId = useId();
  return <svg className={large ? "math-sketch math-sketch-large" : "math-sketch"} viewBox="0 0 240 150" aria-hidden="true">
    <defs><pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor" opacity=".15" /></pattern></defs>
    <rect width="240" height="150" fill={`url(#${patternId})`} />
    {category === "geometry" || category === "spatial" ? <>
      <path d="M55 112 103 30 191 112Z M103 30 103 112 M55 112 146 71" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="103" cy="112" r="5" fill="currentColor" /><circle cx="103" cy="30" r="5" fill="currentColor" />
      <path d="M103 98h14v14" fill="none" stroke="currentColor" />
      <text x="164" y="62" fill="currentColor" fontFamily="Georgia" fontSize="24">α</text>
    </> : category === "calculus" || category === "visual-math" ? <>
      <path d="M24 105H218M70 135V15" stroke="currentColor" strokeWidth="1" opacity=".5" />
      <path d="M23 92C65 150 94-15 132 53S189 142 220 38" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M84 108V55L96 41V108M108 108V40L120 45V108" fill="currentColor" opacity=".15" />
      <text x="153" y="31" fill="currentColor" fontFamily="Georgia" fontSize="24">ƒ(x)</text>
    </> : category === "books" ? <>
      <path d="M38 35Q80 23 120 43Q162 23 203 35V119Q161 107 120 126Q77 108 38 119Z M120 43V126" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M51 52 103 59M51 66 103 73M51 80 88 85M138 61 187 52M138 77 187 68M138 93 171 87" stroke="currentColor" opacity=".6" />
    </> : category === "magic" ? <>
      <circle cx="120" cy="70" r="44" fill="currentColor" opacity=".1" />
      <circle cx="120" cy="70" r="44" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M92 121H148L158 133H82Z" fill="currentColor" opacity=".6" />
      <text x="120" y="83" textAnchor="middle" fill="currentColor" fontFamily="Georgia" fontSize="40">✧</text>
      <path d="m42 30 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z M192 79V95M184 87H200" fill="none" stroke="currentColor" />
    </> : <>
      <path d="M58 27H108V77H58ZM114 27H164V77H114ZM58 83H108V133H58Z" fill="currentColor" opacity=".17" stroke="currentColor" />
      <path d="M130 91 172 78 186 122 143 136Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="83" y="62" textAnchor="middle" fill="currentColor" fontFamily="Georgia" fontSize="28">1</text>
      <text x="139" y="62" textAnchor="middle" fill="currentColor" fontFamily="Georgia" fontSize="28">2</text>
      <text x="83" y="118" textAnchor="middle" fill="currentColor" fontFamily="Georgia" fontSize="28">3</text>
    </>}
  </svg>;
}

function ActivityCard({ activity, locale }: { activity: ActivityEntry; locale: Locale }) {
  const thumbnail = activityThumbnail(activity, locale, sourcePreviews);
  return <a className={`activity-card tone-${activity.category}`} href={`#/activity/${activity.id}`}>
    <div className="card-art">
      {thumbnail
        ? <img src={mediaUrl(thumbnail)} alt="" loading="lazy" />
        : <MathSketch category={activity.category} />}
      <span className="card-category">{categoryName(activity.category, locale)}</span>
      <span className="card-arrow" aria-hidden="true">↗</span>
    </div>
    <div className="card-copy">
      <h3>{activityTitle(activity, locale)}</h3>
      <p>{t(locale, activity.description, activity.descriptionRu)}</p>
    </div>
  </a>;
}

function Collection({ locale, category }: { locale: Locale; category?: CategoryId }) {
  const [query, setQuery] = useState("");
  const matches = activities.filter((activity) => {
    const search = [activity.title, activity.titleRu, activity.description, activity.descriptionRu].join(" ").toLocaleLowerCase();
    return (!category || activity.category === category) && search.includes(query.trim().toLocaleLowerCase());
  });
  return <section className="section collection-page">
    <h1>{category ? categoryName(category, locale) : t(locale, "All activities", "Все занятия")}</h1>
    <div className="collection-tools">
      <label className="search-label">{t(locale, "Search activities", "Поиск занятий")}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(locale, "Triangles, puzzles, magic…", "Треугольники, игры, магия…")} /></label>
      <p className="result-count" role="status">{matches.length} {t(locale, "activities", "занятий")}</p>
    </div>
    <nav className="filter-nav" aria-label={t(locale, "Activity categories", "Разделы")}>
      <a href="#/collection" aria-current={!category ? "page" : undefined}>{t(locale, "All", "Все")}</a>
      {categories.map((item) => <a key={item.id} href={`#/collection/${item.id}`} aria-current={category === item.id ? "page" : undefined}>{item[locale]}</a>)}
    </nav>
    {matches.length ? <div className="activity-grid">{matches.map((activity) => <ActivityCard key={activity.id} activity={activity} locale={locale} />)}</div>
      : <div className="empty-state"><h2>{t(locale, "Nothing here by that name.", "По этому запросу ничего нет.")}</h2><button className="button" onClick={() => setQuery("")}>{t(locale, "Clear search", "Сбросить поиск")}</button></div>}
  </section>;
}

class ActivityBoundary extends Component<{ children: ReactNode; locale: Locale }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("MightyMatica activity failed", error, info.componentStack); }
  render() {
    if (this.state.failed) return <div className="empty-state" role="alert">
      <h2>{t(this.props.locale, "This activity couldn’t open.", "Не удалось открыть занятие.")}</h2>
      <p>{t(this.props.locale, "Try reloading, or choose another activity. Your browser may have an older copy of the site.", "Попробуйте обновить страницу или выбрать другое занятие.")}</p>
      <button className="button" onClick={() => location.reload()}>{t(this.props.locale, "Reload activity", "Обновить страницу")}</button>
      <a href="#/collection">{t(this.props.locale, "Back to collection", "Вернуться к коллекции")}</a>
    </div>;
    return this.props.children;
  }
}

function ActivityView({ activity, locale, reducedMotion, returnTo }: { activity: ActivityEntry; locale: Locale; reducedMotion: boolean; returnTo: string }) {
  const Family = getActivityComponent(activity.family);
  const section = siteSections.find(({ id }) => returnTo === `#/section/${id}`);
  const previousActivity = activities.find(({ id }) => returnTo === `#/activity/${id}`);
  const category = categories.find(({ id }) => returnTo === `#/collection/${id}`);
  const returnLabel = section ? siteSectionTitle(section.id, locale)
    : previousActivity ? activityTitle(previousActivity, locale)
      : category ? categoryName(category.id, locale)
        : returnTo === "#/collection" || returnTo === "#/sources" ? t(locale, "All activities", "Все занятия")
          : returnTo === "#/about" ? t(locale, "About", "О проекте")
            : returnTo === "#/contact" ? t(locale, "Contact", "Контакты") : t(locale, "Home", "Главная");
  return <article className={`activity-page tone-${activity.category}${activity.family === "books" ? " activity-page-book" : ""}`}>
    <div className="activity-heading">
      <a className="text-link" href={returnTo}>← {returnLabel}</a>
      <h1>{activityTitle(activity, locale)}</h1>
      {activity.family !== "books" && <p>{t(locale, activity.description, activity.descriptionRu)}</p>}
    </div>
    <div className="activity-stage">
      <ActivityBoundary key={activity.id} locale={locale}>
        <Suspense fallback={<div className="activity-loading" role="status"><span className="loading-orbit" aria-hidden="true" />{t(locale, "Opening activity…", "Открываем занятие…")}</div>}>
          <Family activityId={activity.id} locale={locale} reducedMotion={reducedMotion} />
        </Suspense>
      </ActivityBoundary>
    </div>
  </article>;
}

function About({ locale }: { locale: Locale }) {
  return <section className="section prose-page">
    <p className="eyebrow">MightyMatica · Thinking Academy</p>
    <h1>{t(locale, "About MightyMatica", "О MightyMatica")}</h1>
    <p className="page-intro">{t(locale, "Yuri Remizov made mathematics something you could watch, question, and play with.", "Юрий Ремизов делал математику наглядной: её можно было рассматривать, исследовать и пробовать в игре.")}</p>
    <p>{t(locale, "The original MightyMatica Thinking Academy was built around visual explanations and interactive problems. Its collection spans elementary sorting games, geometry, mathematical curiosities, calculus, and illustrated course books.", "В основе Академии мышления MightyMatica были наглядные объяснения и интерактивные задачи: от первых игр с фигурами до геометрии, анализа и иллюстрированных учебных книг.")}</p>
    <h2>{t(locale, "A family project", "Семейный проект")}</h2>
    <p>{t(locale, "Yuri’s son Ignat also helped with programming and preparing books for translation. He remembers working on Buffon’s needle, cycloids, the Sierpiński carpet, cube-arrangement puzzles, and falling figures, although the exact division of work is hard to recall after so many years.", "Сын Юрия, Игнат, тоже помогал с программированием и подготовкой книг к переводу. Он помнит работу над иглой Бюффона, циклоидами, ковром Серпинского, задачами на расположение кубиков и падающими фигурами. Спустя столько лет точное распределение работы уже трудно восстановить.")}</p>
    <p>{t(locale, "Ignat also scanned books for translation and later brought some of the games to iOS and Android using Adobe AIR.", "Игнат также сканировал книги для перевода, а позднее перенёс некоторые игры на iOS и Android с помощью Adobe AIR.")}</p>
    <h2>{t(locale, "The web edition", "Веб-версия")}</h2>
    <p>{t(locale, "Ignat Remizov rebuilt the activities for current browsers, using the original lessons, illustrations, books, and films. The mathematical explanations and games have new controls for mouse, keyboard, and touch.", "Игнат Ремизов перенёс занятия в современные браузеры, сохранив оригинальные объяснения, иллюстрации, книги и фильмы. Для занятий и игр добавлено управление мышью, клавиатурой и касаниями.")}</p>
    <h2>{t(locale, "Credits & original artwork", "Авторы и иллюстрации")}</h2>
    <p>{t(locale, "Original MightyMatica collection: Yuri Remizov, with contributions from Ignat Remizov and other credited contributors. Web restoration: Ignat Remizov. Third-party illustrations and cartoon imagery retain their respective attribution and rights; this restoration does not relicense them.", "Оригинальная коллекция MightyMatica: Юрий Ремизов при участии Игната Ремизова и других указанных в материалах соавторов. Веб-версия: Игнат Ремизов. Сторонние иллюстрации и кадры мультфильмов сохраняют авторство и права их владельцев.")}</p>
    <p><a href={`${import.meta.env.BASE_URL}licenses/NOTICE.txt`}>{t(locale, "Software licenses and corresponding source", "Лицензии программных компонентов и исходный код")}</a>
      {" · "}<a href="https://github.com/ignatremizov/mightymatica" target="_blank" rel="noopener noreferrer">{t(locale, "Source repository", "Репозиторий проекта")}</a></p>
    <h2>{t(locale, "Privacy", "Конфиденциальность")}</h2>
    <p>{t(locale, "No account or Flash plugin is needed. The activities run on your device. Language and motion preferences are stored locally when your browser permits it. The application has no analytics or tracking service.", "Аккаунт и Flash-плагин не нужны. Занятия выполняются на вашем устройстве. Настройки языка и движения сохраняются локально, если браузер это разрешает. В приложении нет аналитики и сервисов слежения.")}</p>
  </section>;
}

export default function App() {
  const [page, setPage] = useState<Page>(readPage);
  const [returnTo, setReturnTo] = useState("#/");
  const preferences = usePreferences();
  const { locale, reducedMotion } = preferences;
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    let previousRoute: string | undefined;
    const validRoutes = ["#/", "#/collection", "#/sources", "#/about", "#/contact",
      ...categories.map(({ id }) => `#/collection/${id}`),
      ...siteSections.map(({ id }) => `#/section/${id}`),
      ...activities.map(({ id }) => `#/activity/${id}`)];
    const update = () => {
      const next = readPage();
      const route = location.hash.replace(/^#\/?/, "#/") || "#/";
      if (next.kind === "activity") {
        const entry = activities.find(({ id }) => id === next.id);
        const section = entry && siteSections.find((section) => {
          const pages: Record<string, { links: { source: string }[]; sourceOrder?: string[] }> = siteDesign.pages;
          const sources = [section.source, ...("sourceRu" in section ? [section.sourceRu] : [])];
          return sources.some((source) => {
            const page = pages[source];
            return [...(page?.sourceOrder ?? []), ...(page?.links.map(({ source }) => source) ?? [])]
              .some((source) => entry.sources.includes(source));
          });
        });
        const destination = activityReturnRoute(route, history.state, previousRoute, validRoutes,
          section ? `#/section/${section.id}` : "#/");
        setReturnTo(destination);
        try {
          history.replaceState({ ...history.state, mightymaticaNavigation: { route, returnTo: destination } }, "");
        } catch { /* The link remains usable when history state is unavailable. */ }
      }
      previousRoute = route;
      setPage(next);
    };
    const navigate = () => {
      update();
      window.scrollTo({ top: 0, behavior: "instant" });
      main.current?.focus({ preventScroll: true });
    };
    update();
    addEventListener("hashchange", navigate);
    return () => removeEventListener("hashchange", navigate);
  }, []);
  const activity = page.kind === "activity" ? activities.find(({ id }) => id === page.id) : undefined;
  useEffect(() => {
    const title = activity ? activityTitle(activity, locale)
      : page.kind === "section" ? siteSectionTitle(page.id, locale)
        : page.kind === "about" ? t(locale, "About", "О проекте")
          : page.kind === "contact" ? t(locale, "Contact", "Контакты")
            : page.kind === "collection" ? t(locale, "All activities", "Все занятия")
              : "Thinking Academy";
    document.title = `${title} · MightyMatica`;
  }, [activity, locale, page]);
  return <div className="app">
    <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); main.current?.focus(); }}>{t(locale, "Skip to content", "К содержимому")}</a>
    <OriginalHeader locale={locale} reducedMotion={reducedMotion} home={page.kind === "home"}
      currentSection={page.kind === "section" ? page.id : undefined} onLocale={preferences.setLocale} />
    <main id="main-content" ref={main} tabIndex={-1}>
      {page.kind === "home" ? <OriginalHome locale={locale} reducedMotion={reducedMotion} />
        : page.kind === "collection" ? <Collection locale={locale} category={page.category} />
          : page.kind === "section" ? <OriginalSection key={page.id} id={page.id} locale={locale} reducedMotion={reducedMotion} activityReducedMotion={preferences.activityReducedMotion} />
            : page.kind === "activity" && activity ? <ActivityView key={activity.id} activity={activity} locale={locale} reducedMotion={preferences.activityReducedMotion} returnTo={returnTo} />
              : page.kind === "about" ? <About locale={locale} />
                : page.kind === "contact" ? <OriginalContact locale={locale} />
                  : <section className="section empty-state"><h1>{t(locale, "Page not found.", "Страница не найдена.")}</h1><a className="button" href="#/collection">{t(locale, "Open the collection", "Открыть коллекцию")}</a></section>}
    </main>
    <footer className="site-footer">
      <div><a className="footer-brand" href="#/">MightyMatica</a><p>{t(locale, "Created by Yuri Remizov.", "Создано Юрием Ремизовым.")}<br />{t(locale, "Restored for the web by Ignat Remizov.", "Веб-версия: Игнат Ремизов.")}</p></div>
      <nav aria-label={t(locale, "Footer", "Дополнительные ссылки")}><a href="#/collection">{t(locale, "All activities", "Все занятия")}</a><a href="#/about">{t(locale, "About & credits", "О проекте и авторах")}</a><a href="https://ignatremizov.com/">{t(locale, "Ignat’s portfolio", "Портфолио Игната")} ↗</a></nav>
      <label className="motion-control">
        {t(locale, "Page animation", "Анимация страницы")}
        <select value={preferences.motion} onChange={(event) => preferences.setMotion(event.target.value as "system" | "reduced")}>
          <option value="system">{t(locale, "Use device setting", "Системные настройки")}</option>
          <option value="reduced">{t(locale, "Pause moving illustrations", "Остановить движущиеся иллюстрации")}</option>
        </select>
        <span className="motion-hint">{t(locale, "Lesson play and pause controls are separate.", "В занятиях есть отдельные кнопки запуска и паузы.")}</span>
      </label>
    </footer>
  </div>;
}
