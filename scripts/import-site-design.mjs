#!/usr/bin/env node
// Offline, bounded import of the preserved site's presentation assets.
// No archived HTML, JavaScript, SWF, or generated code is shipped or executed.
import { readFile, writeFile, mkdir, copyFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archive = path.resolve(process.argv[2] ?? path.join(root, '../mightymatica-archive-2026-08-09'), 'local-site');
const output = path.join(root, 'public/media/site-design');
let previousAssets = {};
try { previousAssets = JSON.parse(await readFile(path.join(root, 'src/content/site-design.json'), 'utf8')).assets; }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const assets = {};
const missing = new Set();
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? '';
function local(value) {
  let decoded;
  try { decoded = decodeURIComponent(value.replaceAll('&amp;', '&').split(/[?#]/)[0]); } catch { return ''; }
  if (!decoded || /^(?:[a-z]+:|\/|#)/i.test(decoded)) return '';
  const normalized = path.posix.normalize(decoded);
  return normalized.startsWith('../') ? '' : normalized;
}
async function image(source, width, height) {
  source = local(source);
  if (!/^Images\/.+\.(?:gif|jpe?g|png)$/i.test(source)) return '';
  if (assets[source]) return source;
  let bytes;
  try { bytes = await readFile(path.join(archive, source)); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    missing.add(source);
    return '';
  }
  const destination = path.join(output, source);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(archive, source), destination);
  assets[source] = {
    src: `site-design/${source}`,
    ...(Number(width) > 0 ? { width: Number(width) } : {}),
    ...(Number(height) > 0 ? { height: Number(height) } : {}),
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
  return source;
}
const navDefinitions = [
  ['home', 'Home', 'Index.html', 'Home.jpg', 'Home-button-over.jpg'],
  ['calculus', 'Calculus', 'Calculus.html', 'Calculus-button.jpg', 'Calculus-button-over.jpg'],
  ['books', 'Books', 'Books.html', 'Books-button.jpg', 'Books-button over.jpg'],
  ['livegeometry', 'Live Geometry', 'Livegeometry.html', 'LiveGeometry-button.jpg', 'LiveGeometry-button-over.jpg'],
  ['slidingpuzzles', 'Sliding Puzzles', 'Slidingpuzzles.html', 'Slidingpuzzles.jpg', 'Slidingpuzzles-over.jpg'],
  ['kids', 'For Kids', 'For kids.html', 'Forkids-button.jpg', 'Forkids-button-over.jpg'],
  ['magicmath', 'Magic of Math', 'Magicmath.html', 'Magicmath-button.jpg', 'Magicmath-button-over.jpg'],
  ['funnymath', 'Funny Math', 'Funnylmath.html', 'Funny Math-button.jpg', 'Funny Math-button-over.jpg'],
  ['playmath', 'Play Math', 'Playmath.html', 'Play Math-button.jpg', 'Play Math-button-over.jpg'],
  ['visualmath', 'Visual Math', 'Visualmath-n.html', 'Visual Math-button.jpg', 'Visual Math-button-over.jpg'],
  ['mathsat', 'Math SAT', 'Mathsat.html', 'MathSAT-button.jpg', 'MathSAT-button-over.jpg'],
  ['contact', 'Contact', 'Contactus.html', 'Contactf-button.jpg', 'Contactf-button-over.jpg'],
];
const pages = {};
const layouts = {};
const layoutPages = new Set([
  ...navDefinitions.filter(([id]) => id !== 'home' && id !== 'contact').map((row) => row[2]),
  'Calculus-ru.html', 'Livegeometry-ru.html', 'Slidingpuzzlesru.html',
  'Magicmath-ru.html', 'Visualmath-n-ru.html',
]);
const sourceIllustrations = new Map();
const preservedSources = new Set(JSON.parse(await readFile(
  path.join(root, 'src/content/legacy.json'), 'utf8')).map((entry) => entry.source));
// This is an offline structural reader for these preserved documents, not an
// HTML renderer. Only the explicitly constructed data nodes reach the client.
async function pageLayout(html) {
  const navigationEnd = html.indexOf('</table>', html.indexOf('Images/Contactf-button.jpg'));
  if (navigationEnd < 0) return [];
  const body = html.slice(navigationEnd + 8)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/This book is available for sale/gi, '');
  const rootNode = { tag: 'root', raw: '', children: [] };
  const stack = [rootNode];
  const voidTags = new Set(['img', 'param', 'br', 'hr', 'input', 'meta', 'link']);
  for (const token of body.matchAll(/<\/?[a-z][^>]*>|[^<]+/gi)) {
    const raw = token[0];
    if (!raw.startsWith('<')) {
      stack.at(-1).children.push({ tag: 'text', raw, children: [] });
      continue;
    }
    const tag = raw.match(/^<\/?([a-z0-9]+)/i)?.[1].toLowerCase();
    if (raw.startsWith('</')) {
      const index = stack.findLastIndex((node) => node.tag === tag);
      if (index > 0) stack.length = index;
    } else {
      const node = { tag, raw, children: [] };
      stack.at(-1).children.push(node);
      if (!voidTags.has(tag) && !raw.endsWith('/>')) stack.push(node);
    }
  }
  const decode = (text) => text.replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const find = (node, tag) => node.tag === tag ? node : node.children.map((child) => find(child, tag)).find(Boolean);
  const illustratedHere = new Set();
  const collectIllustrations = (node) => {
    if (node.tag === 'a' && find(node, 'img')) illustratedHere.add(local(attribute(node.raw, 'href')));
    node.children.forEach(collectIllustrations);
  };
  collectIllustrations(rootNode);
  // Several authored tables claim width=200 while containing three ~400px
  // images. Legacy tables expanded to fit those images; preserve that behavior
  // instead of compressing their artwork into three 60px thumbnail columns.
  const contentWidth = (node) => Math.max(node.width ?? 0,
    node.kind === 'tr' ? (node.children ?? []).reduce((sum, child) => sum + contentWidth(child), 0)
      : Math.max(0, ...(node.children ?? []).map(contentWidth)));
  async function convertChildren(children) {
    const result = [];
    for (const child of children) result.push(...await convert(child));
    return result;
  }
  async function convert(node) {
    if (node.tag === 'text') return node.raw.trim() ? [{ kind: 'text', text: decode(node.raw) }] : [];
    if (node.tag === 'object') {
      const param = node.children.find((child) => child.tag === 'param' && attribute(child.raw, 'name').toLowerCase() === 'movie');
      const source = local(attribute(node.raw, 'data') || (param && attribute(param.raw, 'value')) || '');
      return source && !/^Images\/|expressInstall|FLVPlayer/i.test(source)
        ? [{ kind: 'embed', source, width: Number(attribute(node.raw, 'width')) || 550, height: Number(attribute(node.raw, 'height')) || 400 }] : [];
    }
    if (node.tag === 'img') {
      const source = local(attribute(node.raw, 'src'));
      if (!source.startsWith('Images/') || /button|Horizonline|\/Flags\//i.test(source)) return [];
      const imported = await image(source, attribute(node.raw, 'width'), attribute(node.raw, 'height'));
      return imported ? [{ kind: 'image', image: imported, width: Number(attribute(node.raw, 'width')) || undefined,
        height: Number(attribute(node.raw, 'height')) || undefined, label: attribute(node.raw, 'alt') }] : [];
    }
    if (node.tag === 'a') {
      const img = find(node, 'img');
      const href = attribute(node.raw, 'href');
      const source = local(href);
      let children = await convertChildren(node.children);
      // Some archived pages retain empty rollover anchors. Reuse the exact
      // full-size illustration authored for that same source on another page,
      // never a cropped activity thumbnail. Missing-source remnants are not
      // authored picture slots (e.g. Kleinbottleforsite in the ladder text).
      // Actual image children remain intact regardless of source availability.
      if (!children.length && preservedSources.has(source) && !illustratedHere.has(source) && sourceIllustrations.has(source)) {
        const illustration = sourceIllustrations.get(source);
        children = [{ kind: 'image', ...illustration }];
      }
      if (!children.length) return [];
      const hover = await image(node.raw.match(/MM_swapImage\('[^']*','','([^']+)'/)?.[1] ?? '',
        img ? attribute(img.raw, 'width') : children[0]?.width,
        img ? attribute(img.raw, 'height') : children[0]?.height);
      if (/\.swf$/i.test(source)) return [{ kind: 'link', source, children, ...(hover ? { hover } : {}) }];
      // Only HTTPS outbound recommendations survive; no old scripts or forms.
      if (/^https?:\/\//i.test(href)) {
        const url = new URL(href);
        if (url.username || url.password) return children;
        url.protocol = 'https:';
        return [{ kind: 'link', href: url.href, children, ...(hover ? { hover } : {}) }];
      }
      return children;
    }
    if (['script', 'style', 'form', 'param', 'input', 'iframe', 'embed'].includes(node.tag)) return [];
    if (node.tag === 'br') return [{ kind: 'break' }];
    const children = await convertChildren(node.children);
    if (['table', 'tr', 'td', 'th'].includes(node.tag)) {
      const authoredWidth = Number(attribute(node.raw, 'width')) || undefined;
      // Legacy cells also expanded around fixed-size artwork. Keeping a stale
      // td width (For Kids declares 15px around a 402px image) alongside modern
      // max-width images instead gives that column almost no layout space.
      // Repair only undersized width hints; retain larger authored spacing,
      // spans, image dimensions and the table's responsive maximum.
      const containsContentWidth = ['table', 'td', 'th'].includes(node.tag);
      return [{ kind: node.tag, children,
        width: containsContentWidth ? Math.max(authoredWidth ?? 0, ...children.map(contentWidth)) || undefined : authoredWidth,
        colspan: Number(attribute(node.raw, 'colspan')) || undefined,
        rowspan: Number(attribute(node.raw, 'rowspan')) || undefined }];
    }
    if (!children.length) return [];
    if (['p', 'div', 'h1', 'h2', 'h3', 'h4'].includes(node.tag)) return [{ kind: node.tag, children }];
    return children;
  }
  const nodes = await convertChildren(rootNode.children);
  const hasContent = (node) => ['image', 'embed', 'text'].includes(node.kind) || node.children?.some(hasContent);
  return nodes.filter(hasContent);
}
const pageNames = [...new Set([...navDefinitions.map((row) => row[2]), 'Index-ru.html', 'Visualmath.html', 'Programs.html',
  'Calculus-ru.html', 'Livegeometry-ru.html', 'Slidingpuzzlesru.html',
  'Magicmath-ru.html', 'Visualmath-n-ru.html'])];
for (const page of pageNames) {
  const html = await readFile(path.join(archive, page), 'utf8');
  const links = [];
  const sourceOrder = [];
  const seenSources = new Set();
  // Match tags in document order, including nested object fallbacks. Attribute
  // values remain inert strings; no legacy code or markup is executed.
  for (const match of html.matchAll(/<(a|object|param)\b[^>]*>/gi)) {
    const tag = match[0];
    const kind = match[1].toLowerCase();
    const value = kind === 'a' ? attribute(tag, 'href')
      : kind === 'object' ? attribute(tag, 'data')
        : attribute(tag, 'name').toLowerCase() === 'movie' ? attribute(tag, 'value') : '';
    const source = local(value);
    if (!/\.swf$/i.test(source) || seenSources.has(source)) continue;
    seenSources.add(source);
    sourceOrder.push(source);
  }
  const linkedImages = new Set();
  for (const match of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
    const img = match[1].match(/<img\b[^>]*>/i)?.[0];
    if (img) linkedImages.add(local(attribute(img, 'src')));
  }
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const source = local(attribute(match[1], 'href'));
    const img = match[2].match(/<img\b[^>]*>/i)?.[0];
    if (!source || !/\.swf$/i.test(source) || !img) continue;
    const imagePath = await image(attribute(img, 'src'), attribute(img, 'width'), attribute(img, 'height'));
    const hoverPath = await image(match[1].match(/MM_swapImage\('[^']*','','([^']+)'/)?.[1] ?? '',
      attribute(img, 'width'), attribute(img, 'height'));
    if (imagePath) linkedImages.add(imagePath);
    links.push({ source, ...(imagePath ? { image: imagePath } : {}), ...(hoverPath ? { hover: hoverPath } : {}) });
    if (imagePath && !sourceIllustrations.has(source)) sourceIllustrations.set(source, {
      image: imagePath, width: Number(attribute(img, 'width')) || undefined,
      height: Number(attribute(img, 'height')) || undefined,
    });
  }
  const leadImages = [];
  // Unlinked editorial art appearing after chrome and before the first activity.
  const firstActivity = html.search(/<a\b[^>]*href=["'][^"']*\.swf["']/i);
  const leadHtml = page === 'Contactus.html' ? '' : firstActivity >= 0 ? html.slice(0, firstActivity) : html;
  for (const match of leadHtml.matchAll(/<img\b[^>]*>/gi)) {
    const source = local(attribute(match[0], 'src'));
    if (!source.startsWith('Images/') || /button|Horizonline|Mightymatica-logo|\/Flags\/|\/Home\.jpg|\/Slidingpuzzles\.jpg/i.test(source)
      || linkedImages.has(source)) continue;
    const imported = await image(source, attribute(match[0], 'width'), attribute(match[0], 'height'));
    if (imported && !leadImages.includes(imported)) leadImages.push(imported);
  }
  // Record dimensions from preserved markup for all chosen chrome.
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const source = local(attribute(match[0], 'src'));
    if (navDefinitions.some((row) => source === `Images/${row[3]}`)) {
      await image(source, attribute(match[0], 'width'), attribute(match[0], 'height'));
    }
  }
  pages[page] = {
    title: navDefinitions.find((row) => row[2] === page)?.[1] ?? page.replace(/\.html$/, ''),
    leadImages, links, sourceOrder,
    ...(layoutPages.has(page) ? { hasLayout: true } : {}),
  };
}
// Build after collecting every source illustration so cross-page empty
// rollover anchors resolve independently of the manifest's page order.
for (const page of layoutPages) {
  layouts[page] = await pageLayout(await readFile(path.join(archive, page), 'utf8'));
}
const navigation = [];
for (const [id, label, page, normal, hover] of navDefinitions) {
  navigation.push({ id, label, page, image: await image(`Images/${normal}`), hover: await image(`Images/${hover}`) });
}
const polyhedra = [];
// The original home page's explicitly curated external recommendations strip.
for (const name of ['Etudes', 'Artofproblemsolving', 'collmath4kids', 'Mathisfun',
  'Mathplaygroundlbl', 'Intmath', 'Khanacademy']) {
  await image(`Images/${name}.jpg`);
  await image(`Images/${name}-over.jpg`);
}
for (const [normal, hover] of [
  ['Mathgif-Tetrahedron-ongreen.gif', 'Fold_Tetrahedron_320t.gif'],
  ['Mathgif-Dodecahedron-green.gif', 'Fold_Dodekahedron_320t.gif'],
  ['Mathgif-Hexahedron-green.gif', 'Fold_Cube_256t.gif'],
  ['Mathgif-Icosahedron-green.gif', 'Fold_Icosahedron_320t.gif'],
]) polyhedra.push({ image: await image(`Images/${normal}`, 256, 256), hover: await image(`Images/${hover}`, 256, 256) });
const data = {
  version: 1,
  palette: { background: '#66ffff', text: '#330099' },
  assets,
  logo: await image('Images/Mightymatica-logogreen.gif', 246, 275),
  divider: await image('Images/Horizonline.jpg', 1237, 8),
  navigation,
  flags: {
    en: await image('Images/Flags/great-britain-flag-1.gif', 68, 50),
    ru: await image('Images/Flags/russian-flag-animated.gif', 68, 50),
  },
  home: { escher: await image('Images/Escher-stairs-gif.gif', 669, 485), polyhedra },
  pages,
  banners: [
    { source: 'Images/Mightymaticatext.swf', label: 'MIGHTYMATICA', width: 400, height: 200, status: 'source-based-native-glyph-animation' },
    { source: 'Images/Thinkingacademytext.swf', label: 'THINKING ACADEMY', width: 400, height: 200, status: 'source-based-native-glyph-animation' },
  ],
  missing: [...missing].sort(),
};
// Exact first frames, not redrawn art. ImageMagick is local-only and each
// invocation is sequential, single-threaded, and limited to one GIF frame.
for (const [source, asset] of Object.entries(assets)) {
  if (!/\.gif$/i.test(source)) continue;
  const still = `${asset.src}.first-frame.png`;
  execFileSync('convert', ['-limit', 'thread', '1', '-limit', 'memory', '128MiB',
    `${path.join(archive, source)}[0]`, path.join(root, 'public/media', still)], { timeout: 30_000 });
  asset.stillSrc = still;
}
// Decode directly from the recovered source, avoiding a second lossy encode.
// Keep this reproducible alongside the layout which uses the film's poster.
execFileSync('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error',
  '-ss', '5', '-i', path.resolve(root, '../mightymatica-source-recovery/objects/Movies/Moeb7/resources/movies/1.flv'),
  '-frames:v', '1', '-threads', '1', '-update', '1', '-y',
  path.join(output, 'Moeb7-poster.png')], { timeout: 30_000 });
await unlink(path.join(output, 'Moeb7-poster.jpg')).catch((error) => { if (error.code !== 'ENOENT') throw error; });
// Remove only files listed in this importer's previous generated map.
for (const [source, asset] of Object.entries(previousAssets)) {
  if (assets[source]) continue;
  for (const relative of [asset.src, asset.stillSrc].filter(Boolean)) {
    const destination = path.resolve(root, 'public/media', relative);
    if (!destination.startsWith(output + path.sep)) throw new Error('Invalid previous asset path.');
    await unlink(destination).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
}
await mkdir(path.join(root, 'src/content'), { recursive: true });
await writeFile(path.join(root, 'src/content/site-design.json'), JSON.stringify(data, null, 2) + '\n');
await writeFile(path.join(root, 'src/content/site-layouts.json'), JSON.stringify(layouts, null, 2) + '\n');
console.log(`Imported ${Object.keys(assets).length} unchanged images, ${Object.keys(pages).length} pages, ${Object.keys(layouts).length} layouts, ${missing.size} missing references.`);
