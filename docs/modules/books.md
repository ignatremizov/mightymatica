# Recovered book reader

Seven original ordered image sequences are readable using one React reader.
This is a **reader**, not a native recreation of the Flash page-turn animation.
The activity names follow the recovered covers (not a guess from SWF filenames).

| Activity ID | Exact original source | Recovered page photos |
| --- | --- | --- |
| books-mm-sat-101-f | Movies/MM-SAT-101-f.swf | 28 / 28 |
| books-mmcircles | Movies/MMCircles.swf | 28 / 28 |
| books-mathbook-satsubstit | Movies/Mathbook-SATsubstit.swf | 5 / 5 |
| books-mmgrade-1-3 | Movies/MMGrade-1-3.swf | 92 / 92 |
| books-mightymatica-1-1 | Movies/Mightymatica-1-1.swf | 65 / 65 |
| books-mightymatica-1-2 | Movies/Mightymatica-1-2.swf | 65 / 65 |
| books-mightymatica-2-1 | Movies/Mightymatica-2-1.swf | 81 / 81 |

Counts include each sequence's authored title page. They mean all embedded
`BookPages/TBookPage/Photo` images, not a claim that an external print edition
is complete. No page reordering or renumbering based on printed numbers occurs.
Some source scans combine material or have their own nonconsecutive labels.
`MMGrade-1-3` is Grade **1, Part 3**, not Grades 1 through 3.

## Recovery evidence and reproduction

Read the recovery README and MODERNIZATION rubric and the shared runtime:

- `objects/Movies/MMCircles/actionscript/scripts/model/BasicDataParser.as`
- `objects/Movies/MMCircles/actionscript/scripts/model/DataExtracter.as`
- `objects/Movies/MMCircles/actionscript/scripts/model/ProjectParser.as`
- `objects/Movies/MMCircles/actionscript/scripts/BasicOutput.as`
- The exported resource list and reconstructed project directory.

The standard resource export contains runtime chrome, not the actual book.
`BasicDataParser` finds the ten-byte marker `#1@2#3$4%5`.
`DataExtracter.parse()` reads a big-endian runtime byte count, skips its SWF,
then reads a big-endian XML length. Resource streams start immediately after
that XML; their `Position` is relative to that point. The XML BookPages order
is authoritative. No page text overlays occur in these seven containers.
Empty template Cover/BackCover records are chrome, not omitted lesson pages.

Run `python3 src/modules/books/import_books.py` from the project root to
reproduce the selected media and `content.json` from read-only archives.
The importer validates stream bounds and detects JPEG/PNG signatures rather
than trusting filename extensions. It preserves source basenames, captions,
source SWF SHA-256 and extracted image SHA-256 in content.json. It does not
copy Windows user-directory paths into the modern application.

The 364 readable pages occupy about
33 MiB, not a copy of the multi-gigabyte recovery. The reader family is
lazy-loaded. Its preload window retains at most three scans ahead and three
behind the current page, rather than fetching the whole book.

## Substitution: nested document recovery

`Movies/Mathbook-SATsubstit.swf` has five authored entries: its JPEG cover
followed by **four embedded SWF documents**, with original basenames:

- `SAT MATH Bible-13_001.swf`
- `SAT MATH Bible-14_001.swf`
- `SAT MATH Bible-15_001.swf`
- `SAT MATH Bible-20_001.swf`

The four document pages have now been converted. FFDec tag inspection showed
exactly one ShowFrame in each, no ActionScript, no sprite or button timelines,
no text tags, and one full-page DefineBitsJPEG3 bitmap (character 3).
Thus there are no page-specific animated companions or interactive controls
inside these four documents to recreate. Their mathematical text, diagrams,
worked examples and printed page numbers remain in the original bitmap.
The skipped printed page numbers are intentional source order, not missing
recovered slots.

FFDec `-export image` extracts character 3 to PNG at its original resolution,
avoiding a low-resolution stage screenshot. The shared reader presents these
four PNGs after the original cover. No legacy Flash runtime is required.
Reproduce conversion by passing `--java /path/to/java --ffdec /path/to/ffdec.jar`
to the importer. Without these options it reuses previously converted PNGs.
Intermediate read-only-reference copies and inspection exports are under
`.cache/book-recovery` (self-ignored); these are not runtime imports or shipped page
content. SVG frame export was investigated but not used: original bitmap
extraction is simpler and preserves resolution without nested SVG patterns.

The eager `manifest.ts` contains only seven compact metadata tuples and imports
no content inventory. All 364 page paths, captions and hashes remain in
`content.json`, imported only by the lazy reader.

## Reader behavior and limits

Previous/next controls, a labeled page selector, bounded zoom,
and keyboard arrows/Home/End in the focused scrollable reading
region work without Flash. Book changes remount reader state. Image load
errors have a visible explanation. Native image context menus remain available
for opening or saving scans; there is no redundant separate scan button. Controls/status are
localized; original page artwork is never silently translated.

Normal reading uses the document's natural flow: 100% fits the scan to the
reader width, and higher zoom enlarges the actual image while preserving its
aspect ratio. There is no fixed-height clipping box or artificial aqua gutter
inside the scaled image. The browser handles vertical and horizontal scrolling.
The toolbar, status and brief navigation hint use compact spacing.

The Full screen control requests the browser's native fullscreen mode for only
the reader, excluding the site header and footer. At 100% the whole page fits
the remaining space beneath the controls; enlarged pages scroll within that
fullscreen area. The displayed size is recomputed when the viewport changes.
Escape or Exit full screen returns to normal reading, preserving the current
page and zoom and restoring the prior document position and control focus.
Unsupported or rejected fullscreen requests leave normal reading available
with a clear message. No fullscreen fallback, new window, or application route
is introduced.

Scan images are not selectable or draggable, avoiding native highlighting on
repeated page-turn clicks; surrounding text remains selectable and right-click
is not intercepted. Failed image loads expose a retry action.

The first scan is labeled “Cover”. Other ordinary page labels identify their
one-based position in the reader, not an asserted printed page number. The
Substitution documents instead expose the four verified printed folios
13, 14, 15 and 20; status still reports their position in the five-scan sequence.
Source filenames remain in the lazy inventory, not in visible reader labels.
The Grade 1, part 1 title explicitly distinguishes it from part 2.

Scanned page contents are **not transcribed**, searchable, or readable as full
text by screen readers. Alt text identifies the page and explicitly states
this limitation. No OCR-generated lessons, invented exercises, answer marking,
music, Ncesoft template background, decorative cover, or page-curl effect is
claimed restored. No animation is introduced; reduced-motion needs no special
runtime. Original artwork and third-party illustrations remain under their
original rights; this restoration grants no blanket media license.

## Verification

### Presentation and navigation review

Reviewed all seven source `DOMDocument.xml` containers: each is a white
900×600 runtime. The archived `Books.html` uses the collection's aqua
`#66ffff` background; the extracted Circles cover itself also uses aqua.
The reader now leaves each scan's real colors intact, centers the book within
900px, and removes the rounded gray surround and visible recovery commentary.
Concise attribution and the scan-transcription accessibility limitation remain.

The later control review removed the repeated collection-author footer; collection
attribution remains in the site shell. Page-level scan accessibility wording,
navigation, half-page clicks and scroll retention were left unchanged.

Pagination reserves the previous page extent while a new scan loads, then
restores the document scroll position (or the inner scroll position when in
fullscreen), clamped by the browser if the next page is shorter. The bounded
preloader reuses overlapping neighbouring scans and drops references outside
the six-page window; unmounting releases the remaining preload requests.
Buttons, page selection and keyboard navigation share the same bounded
page-change handler. Clicking either half of the scan turns backward/forward;
pointer cancellation, a gesture exceeding eight pixels, and selected text
suppress page turns. Native controls remain available to keyboard and
assistive-technology users.

Direct source/code inspection only for this review; no browser, compiler,
build or automated interaction checks. Manually verify that all four navigation
paths retain both site and reader scroll position, including slow image loads,
zoomed pages, first/last-page bounds and drag/touch scrolling.

Importer run succeeded for all seven containers; 364/364 authored page slots
have images, including the four converted nested document pages.
Locally inspected original Circles problem page, four grade-book covers, and
the extracted full-resolution Substitution page 13. All four nested document
tag inventories were inspected for scripts, sprites, buttons and multiple frames.
Asset checks verify each extracted image against its recorded SHA-256 and
valid JPEG/PNG signature. No browser, dev server, compiler, full test suite or
build was run by this worker (integrated checks belong to Main).

Manual checklist: open each book, read its cover, next/previous and jump to the
last page; exercise keyboard endpoints; zoom and scroll on narrow screens;
confirm no scan content is clipped in normal document flow; enter fullscreen,
resize, zoom, and exit using both the button and Escape; confirm a whole page
fits at fullscreen 100% and the page/zoom and normal document position survive
exit; turn several pages in either direction after preload; right-click
a scan to open it separately; double-click without native image highlighting;
change locale without expecting image translation;
check focus visibility and an unavailable-image error.

### Final sharded review

Reviewed the shared reader paths for all seven manifest entries listed above:
364 authored slots in total. Rechecked each source `DOMDocument.xml` (white,
900×600), the Circles `BasicOutput` fullscreen handling, and
`BasicDataParser`/`DataExtracter` ordered resource extraction. A read-only Node
validation compared all seven source SWF hashes and all 364 shipped scan
hashes with the lazy content inventory; every comparison passed.

No new confirmed reader defect was found by this source/code review.
Document-flow zoom, reader-only fullscreen, fullscreen focus/scroll recovery,
the bounded ±3 preload window and its teardown, native image context menus,
drag/cancel suppression, image retry, page bounds and localized controls were
left unchanged. No quiz gate or artificial completion state was introduced.
This review does not establish visual parity for all 364 pages: no browser,
compiler, build or image-by-image visual pass was performed. The manual
checklist above remains necessary, especially zoomed horizontal scrolling,
touch-scroll versus click behavior and delayed/failed page loading.

### Rendering/performance review

Reviewed all seven entries in the coverage table, their shared `Reader`,
`reader.css`, lazy `content.json`, compact manifest and recovery importer.
There is no Canvas, generated painter, pixel filter, animation timer or
per-frame React update in the reader. Image loading and navigation drive
state; fullscreen alone installs a `ResizeObserver`, which disconnects on
exit and avoids state changes when its measured dimensions are unchanged.
Ordinary zoom remains in free-height document flow.

The preloader retains at most three neighbouring scans on each side, reuses
overlapping neighbours, and releases out-of-window requests and all retained
images on unmount. Its effect depends on the book/page, not zoom, fullscreen,
image-load state or pointer motion. The current scan is a separate native
image; the browser owns decoding and cache retention. No whole-book prefetch,
filter caching or new image processing is needed. Reader fullscreen, native
image menus and the ±3 preload policy were left unchanged.

A read-only Node validation passed for all seven recorded original SWF hashes
and all 364 shipped scan hashes. The Circles `BasicDataParser.as` and
`DataExtracter.as` were rechecked as source evidence for the ordered image
container; no archive was modified. No concrete rendering/lifecycle defect
was found, so this review changes documentation only. There are no unhandled
generated text filters in this family. No browser, FPS benchmark, compiler,
build, importer run or full suite was performed; the manual checklist above
remains necessary.
