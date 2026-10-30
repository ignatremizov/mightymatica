#!/usr/bin/env node
/**
 * Offline, repeatable catalog import. Archives are read-only inputs.
 * Usage: node scripts/import-catalog.mjs [archive-root] [recovery-root]
 */
import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archive = path.resolve(process.argv[2] ?? path.join(project, '../mightymatica-archive-2026-08-09'));
const recovery = path.resolve(process.argv[3] ?? path.join(project, '../mightymatica-source-recovery'));
const raw = path.join(archive, 'raw-site');
const inventory = async (name) => JSON.parse(await readFile(path.join(recovery, 'inventory', `${name}.json`), 'utf8'));
const [objects, usages, triage] = await Promise.all([
  inventory('swf-recovery'), inventory('site-usage'), inventory('modernization-triage'),
]);
const usageBySource = new Map(usages.map((row) => [row.source_relative_path, row]));
const triageBySource = new Map(triage.map((row) => [row.source_relative_path, row]));
const sourceNames = new Set(objects.map((row) => row.source_relative_path));
if (objects.length !== 207 || sourceNames.size !== objects.length) {
  throw new Error('Expected exactly 207 distinct source paths; review the inventory before updating this importer.');
}

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', copy: '©' };
function decode(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, key) => {
    if (key.startsWith('#')) {
      const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return entities[key.toLowerCase()] ?? whole;
  });
}
function text(html) {
  return decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function attribute(tag, name) {
  return decode(tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? '');
}
function localPath(value, page) {
  if (!value || /^(?:[a-z]+:|\/\/|#)/i.test(value)) return undefined;
  let decoded;
  try { decoded = decodeURIComponent(value.split(/[?#]/)[0]); } catch { return undefined; }
  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(page), decoded));
  return resolved.startsWith('../') || resolved.startsWith('/') ? undefined : resolved;
}
function readable(source) {
  return path.posix.basename(source, '.swf')
    .replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function usableTitle(value) {
  return value.length >= 7 && value.length <= 160 && !/^(?:image|imm|img|flash|logo|button|slid|slipuz|dslpuz|million\d|algtrans|mm\d|tt\d)/i.test(value)
    && !/(?:https?:|@|adobe|flash player|requires a newer)/i.test(value);
}

// Manually inspected title text, not an arbitrary first text field (which is
// often a point label, score, or instruction). Keep the exact evidence path.
const recoveredTitleFiles = new Map([
  ['Movies/Alltriangles.swf', '3.txt'],
  ['Movies/Circle.swf', '7.txt'], ['Movies/Circle-ru.swf', '7.txt'],
  ['Movies/Sinlaw.swf', '2.txt'], ['Movies/Sinlaw-ru.swf', '2.txt'],
  ['Movies/Coslaw.swf', '2.txt'], ['Movies/Coslaw-ru.swf', '2.txt'],
]);

// Only page names already established by the recovery index are inspected.
// About/contact/privacy pages are never harvested into public content.
const pageNames = [...new Set(usages.flatMap((row) => row.pages))]
  .filter((page) => !/(?:about|contact|privacy)/i.test(page)).sort();
const links = new Map();
const originalPages = [];
for (const page of pageNames) {
  const html = await readFile(path.join(raw, page), 'utf8');
  const clean = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const heading = [...clean.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)]
    .map((match) => text(match[1])).find((value) => value.length > 2);
  // Introductory prose only: stop at the first activity anchor after the heading.
  // This avoids pulling instructions, footer contacts, or unrelated navigation.
  const headingEnd = clean.search(/<\/h[12]>/i);
  const intro = headingEnd < 0 ? '' : clean.slice(headingEnd).split(/<a\b[^>]*href=["']Movies\//i)[0];
  const descriptions = [...intro.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => text(match[1]))
    .filter((value) => value.length >= 45 && value.length <= 700
      && !/(?:@|https?:|copyright|contact|phone|address|flash player|requires a newer)/i.test(value)).slice(0, 3);
  originalPages.push({ source: page, title: heading ?? readable(page.replace(/\.html$/i, '.swf')), descriptions });
  for (const match of clean.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const source = localPath(attribute(match[1], 'href'), page);
    if (!sourceNames.has(source)) continue;
    const image = match[2].match(/<img\b[^>]*>/i)?.[0];
    const label = text(match[2]) || (image ? attribute(image, 'alt') : '');
    const candidate = {
      page, title: usableTitle(label) ? label : undefined,
      image: image ? localPath(attribute(image, 'src'), page) : undefined,
    };
    const candidates = links.get(source) ?? [];
    candidates.push(candidate);
    links.set(source, candidates);
  }
}

const bookNames = new Set(['MM-SAT-101-f', 'MMCircles', 'MMGrade-1-3', 'Mathbook-SATsubstit',
  'Mightymatica-1-1', 'Mightymatica-1-2', 'Mightymatica-2-1']);
function kind(source) {
  if (/^(?:Images|Scripts)\//.test(source) || source === 'FLVPlayer_Progressive.swf') return 'support';
  if (bookNames.has(path.posix.basename(source, '.swf'))) return 'book';
  const evidence = triageBySource.get(source);
  if (evidence?.video_tags > 0 && !evidence.mouse_input && !evidence.keyboard_input) return 'media';
  return 'activity';
}

await mkdir(path.join(project, 'src/content'), { recursive: true });
await mkdir(path.join(project, 'public/media/catalog'), { recursive: true });
const media = new Map();
let mediaBytes = 0;
const catalog = [];
for (const object of objects) {
  const source = object.source_relative_path;
  // Verify actual archived bytes, rather than trusting an unchecked metadata join.
  const bytes = await readFile(path.join(raw, source));
  if (createHash('sha256').update(bytes).digest('hex') !== object.sha256) throw new Error(`Hash mismatch: ${source}`);
  const usage = usageBySource.get(source);
  if (!usage || usage.sha256 !== object.sha256 || !triageBySource.has(source)) throw new Error(`Inventory mismatch: ${source}`);
  const candidates = links.get(source) ?? [];
  const label = candidates.find((candidate) => candidate.title);
  const recoveredFile = recoveredTitleFiles.get(source);
  const recoveredPath = recoveredFile
    ? `objects/${source.slice(0, -4)}/resources/texts/${recoveredFile}` : undefined;
  const recoveredTitle = recoveredPath
    ? (await readFile(path.join(recovery, recoveredPath), 'utf8')).replace(/--- RECORDSEPARATOR ---/g, ' ').replace(/\s+/g, ' ').trim()
    : undefined;
  const entry = {
    source, title: recoveredTitle ?? label?.title ?? readable(source), sha256: object.sha256,
    width: object.width_px, height: object.height_px, pages: [...usage.pages],
    kind: kind(source),
    titleSource: recoveredPath ? `recovery:${recoveredPath}` : label ? `html:${label.page}` : 'filename',
  };
  const candidate = candidates.find((item) => item.image && /\.(?:png|jpe?g|gif)$/i.test(item.image));
  if (candidate) {
    const sourceImage = candidate.image;
    const input = path.join(raw, sourceImage);
    const info = await stat(input).catch(() => undefined);
    // Original linked previews only, max 256 KiB each / 12 MiB total.
    // Do not copy SWFs, scripts, tracking pixels, or contact assets.
    if (info?.isFile() && info.size >= 512 && info.size <= 262144
      && !/(?:address|contact|email|phone|counter|tracking)/i.test(sourceImage)
      && (media.has(sourceImage) || mediaBytes + info.size <= 12 * 1024 * 1024)) {
      if (!media.has(sourceImage)) {
        const data = await readFile(input);
        const sha256 = createHash('sha256').update(data).digest('hex');
        const output = `${sha256.slice(0, 20)}${path.extname(sourceImage).toLowerCase()}`;
        await copyFile(input, path.join(project, 'public/media/catalog', output));
        media.set(sourceImage, { source: sourceImage, path: `media/catalog/${output}`, sha256, bytes: info.size });
        mediaBytes += info.size;
      }
      entry.thumbnail = media.get(sourceImage).path;
    }
  }
  catalog.push(entry);
}
const writeJSON = (file, value) => writeFile(path.join(project, file), `${JSON.stringify(value, null, 2)}\n`);
await writeJSON('src/content/legacy.json', catalog);
await writeJSON('src/content/previews.json', Object.fromEntries(
  catalog.filter((entry) => entry.thumbnail)
    .map((entry) => [entry.source, entry.thumbnail.slice('media/'.length)]),
));
await writeJSON('src/content/original-pages.json', {
  pages: originalPages,
  credits: [
    { name: 'Yuri Remizov and original site authors', role: 'Original MightyMatica collection; attribution retained, not a new license grant.' },
    { name: 'M. C. Escher / relevant rights holders', role: 'Referenced third-party artwork; separate rights review required.' },
  ],
  media: [...media.values()],
});
console.log(JSON.stringify({
  sources: catalog.length,
  uniqueHashes: new Set(catalog.map((entry) => entry.sha256)).size,
  kinds: Object.fromEntries(['activity', 'support', 'book', 'media'].map((value) => [value, catalog.filter((entry) => entry.kind === value).length])),
  htmlTitles: catalog.filter((entry) => entry.titleSource.startsWith('html:')).length,
  recoveredTitles: catalog.filter((entry) => entry.titleSource.startsWith('recovery:')).length,
  thumbnails: catalog.filter((entry) => entry.thumbnail).length,
  mediaFiles: media.size, mediaBytes, pages: originalPages.length,
}, null, 2));
