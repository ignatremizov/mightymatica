# MightyMatica

A web-native restoration of Yuri Remizov's interactive mathematics collection.
This standalone React + TypeScript + Vite application needs no backend.

The source of truth is the preserved 2026-08-09 site export and its recovered
ActionScript, vector artwork, text, and authored Falling Figure sources. Those
preservation trees remain untouched and outside this repository.

## Run

```sh
npm install
npm run dev
npm run check
npm run build
npm run preview
```

The configured public base is `/mightymatica/`. Local previews use port 4174 so
the portfolio's port 4173 remains available. Activity bookmarks use hash routes
and work on static hosting without a server rewrite.

To preview both projects through the portfolio's existing server, build both
projects, then run this command from this repository:

```sh
npm run compose:portfolio -- /home/ignat/code/website/dist
```

Open `http://localhost:4173/mightymatica/` after composition. This copies only the
built static files; it does not publish anything. Rebuilding the portfolio
replaces its generated directory, so compose again afterward.

## Alpha scope

The current build exposes 143 activities across 20 families, including seven
books with 364 original page images, recovered cartoon films, and native Canvas
artwork timelines. All 203 activity, book, and media source objects have a web
representation. The 207-file inventory also contains two animated mastheads,
now part of the site shell, and the old Flash installer and video player.
Those four support files are not separate activities.
`docs/restoration-report.json` records the internal source-to-activity mapping;
the report is not included in the published artifact.

All media loads on demand. The complete static artifact is about 796 MiB; some
optional original-art timelines are large. That total is not an initial page
download.

The shell follows the original website: turquoise background, original
illustrated logo and image-button menus, folding-polyhedron and Escher artwork,
and the original section names and source order. The About page retains updated
content. See [original site design](docs/original-site-design.md) for source
evidence and [wordmarks](docs/original-wordmarks.md) for the native title animation.

## Restoration policy

The internal catalog distinguishes native ports, mathematical adaptations, and
book readers. A source mapping does not certify complete narration, animation,
sound, or interaction parity; individual module notes record those limits.

The restoration target is the original Flash applet UX as closely as possible:
initial questions and prerequisites, answer gates, teaching sequence, authored
layout, and direct dragging, drawing, and playback remain the primary experience.
Current replacement interfaces are fidelity gaps to restore, not a standing
direction to redesign lessons. Accessible controls and inspection tools should
supplement that experience without bypassing its questions or revealing solutions
early. Explicit user choices take precedence: the requested freeform jigsaw with
snapped movable groups overrides original wrong-return/correct-lock behavior.
This policy does not claim that the remaining applets already match their
originals, nor require preserving mathematical defects.

English/Russian variants share behavior. SVG and semantic HTML suit most
diagrams; bounded Canvas is used for simulations and lazy Three.js only for
genuine spatial interaction. No Flash runtime, analytics, or external services
are required by the native activities.

Started playback continues when switching tabs or moving focus elsewhere.
Play/Pause, Sound, reduced-motion preferences, and leaving the activity still
control playback. Hidden lessons advance their clock without redrawing Canvas;
source questions and Hint stops remain mandatory. Browser or operating-system
suspension can still interrupt background media.

Game sound effects are enabled initially and play only from interactions.
Music, films and lesson narration still require their own explicit playback
action; opening an activity does not start a soundtrack.

Copyright and source attribution are retained. Recovered third-party media are
not automatically relicensed. Original SWFs are local comparison material only;
none are shipped, and no emulator is required.

Type-checking, deterministic tests, and production build checks do not establish
visual parity. See [publishing](docs/publishing.md) for manual acceptance and
release gates, [animated companions](docs/animated-companions.md) for the native
drawing pipeline and its license review, and [rights and provenance](docs/rights-and-provenance.md)
for original-media restrictions. Publication uses GitHub Pages, with a separate
repository and the same build included at `ignatremizov.com/mightymatica/`.
The About page links the upstream software notices and corresponding runtime
source package; those terms do not relicense the original illustrations or media.
