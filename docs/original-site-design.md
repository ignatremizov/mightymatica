# Original website presentation assets

`node scripts/import-site-design.mjs [archive-root]` imports only local images
from the preserved archive's `local-site/` directory. The default archive is
`../mightymatica-archive-2026-08-09`. This command uses local ImageMagick
`convert` for exact first-frame PNG alternatives to GIFs, sequentially with one
thread. It does not access the network, execute old scripts, or ship HTML, SWF,
or Flash support files.

The generated `src/content/site-design.json` has:

- `assets`, keyed by original relative image path. Each entry contains `src`
  relative to `public/media/`, SHA-256 of the unchanged source image, and
  `width`/`height` when available from original markup. These are authored
  display dimensions, not necessarily encoded bitmap dimensions.
- `stillSrc` for every GIF, also relative to `public/media/`. These are
  first-frame derivatives; the original GIF bytes remain unchanged.
- `logo`, `divider`, `flags`, `home.escher`, and `home.polyhedra` referencing
  asset keys. Polyhedron entries have `image` and `hover`.
- `navigation` entries with stable `id`, original `label`, original `page`,
  `image`, and `hover`. The shell decides modern routes.
- `pages`, keyed by preserved HTML filename. `leadImages` contains unlinked
  introductory images before the first linked SWF. `links` preserves the order
  of local SWF anchors and their original `source`, `image`, and `hover`, where
  present. Repeated source links remain repeated. This is not an inventory of
  embedded objects or externally hosted games, nor an assertion of playability.
- Each page's `sourceOrder` separately records deduplicated local SWF paths in
  actual document order across anchor `href`, object `data`, and
  `<param name="movie" value="…">` references. Nested object fallbacks occur only
  once. Header/support SWFs remain in this provenance list; consumers should
  resolve only sources with native activities. No listed SWF is shipped.
- `banners` identifying the two original Flash banners and their source-based
  native glyph-animation status, plus a `missing` reference list.
- `pages[filename].hasLayout` marks an authored section layout. The inert arrays
  live separately in `src/content/site-layouts.json`, keyed by original filename,
  so the shell can lazy-load them without adding the trees to its eager catalog.

The importer covers the home page, Russian home, principal English navigation
pages, all five preserved Russian section variants, the older Visual Math page,
and Programs. Contact navigation is retained,
but contact content and address art are deliberately not copied. No payments,
analytics, contact details, or external-service scripts are imported.
The seven original home-page recommendation image buttons and their hover
variants are explicitly allowlisted from `Index.html` lines 158–172; importing
their images does not execute or import anything from the recommended sites.

## Source evidence

`local-site/Index.html` establishes background `#66ffff`, body/text `#330099`,
the 246 × 275 central `Images/Mightymatica-logogreen.gif`, two 400 × 200
Flash header areas, the horizontal divider, image navigation with hover swaps,
and the Escher stairs surrounded by four folding polyhedra.
The preserved `reference-screenshots/01-playmath-top.png` confirms the cyan
background, blue image navigation, and `Images/Forplaymath.gif` section art.
`Visualmath-n.html` provides the topology-hands and waterfall introductory GIFs.
Other page link order and images are extracted directly from their preserved
markup rather than reconstructed from activity titles.

All original images retain their original rights and attribution; this import
does not grant a new license to third-party illustrations.

## Header banner source evidence

Both source banners were inspected:

- `Images/Mightymaticatext.swf`
- `Images/Thinkingacademytext.swf`

Their recovered `objects/Images/<name>/pcode/scripts/frame_1/DoAction.pcode`
contains the authored `PropertyData`: text `MIGHTYMATICA` at size 45 and
`THINKING ACADEMY` at size 35, bold, dark blue `#00008b`, horizontal and vertical
center alignment, zero offsets, and aquamarine `#7fffd4` configured background.
The corresponding `project/.../LIBRARY/Symbol 7.xml` specifies Arial. Both
`DOMDocument.xml` files specify 400 × 200 and 12 fps. The text settings specify
entry delay 5 and letter delay 20; these values alone do not establish a faithful
native motion sequence.

The scripts dynamically instantiate letters using `attachMovie`; authored
glyphs are not placed on the root timeline. Sequential exports through the
existing serialized `export-original-frames.mjs` helper selected root frames
1–6 for each banner. Inspection found empty root drawing switch cases.
`convert-canvas-export.mjs` rejected the first export with
`Unrecognized FFDec timeline boilerplate.` The generated export uses packed
script boilerplate; no such code was evaluated, unpacked, or shipped.

The initial shell used static native DOM titles because the empty root drawing
exports were not sufficient to reconstruct the banners. The header now composes
the separately reviewed `OriginalWordmark` controller for `mightymatica` and
`thinking-academy`. That controller reconstructs the source-authored nested
glyph motion without a Flash runtime or evaluating recovered scripts. Semantic
title text remains available outside the decorative canvases. Reduced motion
uses the controller's settled wordmark. Native Arial glyph metrics remain an
approximation rather than a claim of pixel-exact Flash text rendering.

## Verification and handoff

The importer completed with 386 original images, 20 page records, and zero
missing references. A second execution produced the same manifest. Original
image hashes and all 19 generated still paths were checked against the local files.
All 20 source-order lists were checked for exact-source deduplication.
No browser, compiler, application build, dependencies, or test suite was run
for this asset-only slice. Integrated type/build checks belong to shell
integration; visual acceptance still requires checking header layout, hover
states, mobile wrapping, deferred image loading, and reduced-motion stills.

## Shell integration

`src/app/OriginalSite.tsx` restores the masthead, original central logo, divider,
bitmap navigation and rollovers, flags, home-page Escher/polyhedron composition,
recommendation image buttons, and original named sections. The primary shell
uses the archived turquoise and blue palette. Updated About/credits content
remains on its quieter reading surface, as requested.

Section routes use `#/section/<id>`. Existing native activity and collection
bookmarks still work. The source-order list is resolved against native activity
metadata; it never links users to a shipped SWF. English/Russian variants share
their native activity while using the appropriate original section art.
The substitution book remains in Math SAT, not added to the original Books
section. Embedded sources not represented by image anchors retain their
document order. Contact links lead to the current portfolio rather than copying
old personal contact information.

## Source-authored page layouts and embedded presentation

All ten named sections and their five preserved Russian variants now have a
generated `site-layouts.json[filename]` tree rather than a uniform activity-card
grid. These cover Calculus, Books, Live Geometry, Sliding Puzzles, For Kids,
Magic of Math, Funny Math, Play Math, Visual Math and Math SAT. Homepage,
contact, payment and legacy Programs/Visualmath pages do not receive section
layout trees. The importer reads only the content after the
original navigation table. Layout nodes retain tables, rows, cell spans,
headings, paragraphs, image occurrences, links and embedded presentation slots.
Image display dimensions are recorded per occurrence, so a picture reused at
different sizes is not forced into the first imported size.

Only inert text, explicitly recognized node kinds, numeric dimensions/spans,
local image asset keys and reviewed link destinations reach React. Script,
style and payment-form blocks, Flash fallback contents, old sale invitations,
tracking images and legacy attributes are omitted. No archived HTML is injected
or executed. Outbound illustrated game recommendations remain explicit HTTPS
links opening separately; the app never embeds the external site.

The original Sliding Puzzles Escher table declares a width of only 200 pixels
but places three roughly 400-pixel pictures in each row. Legacy table layout
expanded to accommodate them. The importer therefore derives a table's minimum
content width from its source-authored cells and pictures instead of squeezing
those pictures into thumbnail-sized columns. On narrow screens, the same rows
stack in reading order. Original bitmap proportions, complete uncropped images,
and rollover artwork remain intact.

The same content-width repair applies to individual cells, not only tables.
For example, `For kids.html` lines 187–189 declare cell widths 415, 869 and
15 around illustrations authored at 466, 445 and 402 pixels respectively.
Responsive images otherwise allow the Falling Figures column to collapse to
roughly 15 pixels. Imported cell width hints are therefore at least their
descendant artwork's authored width: this row becomes 466, 869 and 402.
Larger source spacing, row order, spans and image aspect ratios are retained.
These remain responsive width hints, not fixed minimums that force horizontal
overflow; the existing narrow-screen layout stacks the cells in reading order.

Play Math's preserved HTML contains empty Escher and story-game rollover
anchors. For these authored slots, the importer reuses the full original
illustration attached to the exact same SWF source in Sliding Puzzles, with
that illustration's original display dimensions. It does not substitute cropped
activity thumbnails or duplicate an anchor already illustrated on the page.
Those reused images occupy Play Math's own original rows/cells.

Empty-anchor reconstruction is additionally restricted to sources present in
`src/content/legacy.json`, the preserved SWF inventory. A cross-page illustration
alone is not evidence that an empty anchor was a visible picture slot.
`Livegeometry.html` and `Livegeometry-ru.html` contain an empty
`Movies/Kleinbottleforsite.swf` rollover anchor inside the ladder description;
that SWF is absent from the preserved inventory. It therefore does not acquire
the Klein bottle picture from the older Visual Math page. Actual authored
Klein bottle image anchors remain in the page image metadata unchanged.

The sliding-ladder activity's preview uses the already imported exact first
frame of `Images/Ladder-green1.gif`, the original illustration immediately above
the embedded ladder examples in Live Geometry. It shows the source's cyan axes,
yellow ladder line and red midpoint, rather than unrelated kitten artwork or a
newly drawn thumbnail. This is a source illustration, not a screenshot of the
native interactive activity.

Native embedded loading fallbacks reserve the authored slot aspect ratio.
The cycloid additionally reserves its existing diagram's bounded
`clamp(240px, 50vw, 460px)` height plus 400px for wrapping controls, orbit position
and status in closed, loading and loaded states. This is a minimum layout
reservation, not a forced diagram height or clipped container; unusually large
text or long localized controls can still expand it. No new module is eagerly
loaded to construct the placeholder.

For this correction the importer was rerun locally: all 445 image entries and
the complete `site-design.json` remained unchanged; only the English and Russian
Live Geometry layout trees changed, each losing its one reconstructed empty
Klein bottle anchor. The exact original ladder still was visually inspected as
an image file. Browser interaction and font-dependent slot sizing were not
verified; manual acceptance should open both ladder and cycloid in each
language, repeat with a cold module cache and narrow viewport, and check that
following content stays steady during loading.

The Books Möbius slot retains its authored 640 × 480 presentation. Its visible
poster, `public/media/site-design/Moeb7-poster.png`, is a lossless decoded video
frame at five seconds directly from the read-only recovered
`objects/Movies/Moeb7/resources/movies/1.flv`; it avoids deriving a JPEG from
the already transcoded MP4. The importer reproducibly extracts this frame using
local single-threaded FFmpeg. The silent film loops automatically while its slot
is near the viewport. Page reduced-motion settings, offscreen scrolling and tab
hiding suspend automatic playback; an explicit user pause is retained. Native
play/pause controls remain available, without an extra standalone-film link.

The Funny Math Escher sphere uses the existing original vector timeline at its
authored 638 × 466 slot. Its drawing module is requested only as the slot
approaches the viewport. Live Geometry's leading 550 × 400 octahedron similarly
loads the existing native spatial activity on approach; this remains an
adaptation, not a claim of exact original Flash parity. Other embedded native
activities are explicitly opened in place. The duplicate full-page links below
embedded activities are removed. Spatial and motion controllers use compact
embedded presentation instead of inserting a full activity page into the slot.
Animation and teardown stay with their existing shared players.
Contact uses the original shell's section classes and retains only present-day
contact information.

The importer currently produces 445 unchanged source images, 20 page records,
15 authored layout trees and zero missing image references. Layout-data
inspection confirmed the expected embedded sources and the absence of scripts,
Flash-install links, payment content and tracking references. The Möbius poster
was visually inspected as a meaningful Möbius-strip/ants frame. No browser,
compiler, application build or test suite was run for this layout slice; Main
owns integration checks. Manual acceptance should compare the first two rows
of Live Geometry and Play Math with the archive screenshots, check the full-size
Escher rows, play/pause Möbius, and repeat on a narrow screen and with reduced
motion enabled.

The original GIFs use their exact first-frame alternatives when reduced motion
is enabled. Touch input does not activate mouse-only rollover imagery.

Integrated TypeScript and production build checks passed, including native-only
output and the eager-transfer gate. Source-order/native-destination checks passed
for all ten sections. Browser automation was not run; visual correspondence,
mobile layout, and interaction feel still require manual confirmation.
