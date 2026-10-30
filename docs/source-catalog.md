# Source catalog

`src/content/legacy.json` inventories every one of the 207 archived SWF paths.
It is a preservation inventory, **not a claim that 207 native activities exist**.
English/Russian variants, loader children, branding, installation helpers, and
byte-identical copies remain separate source records. Native source coverage
must instead be computed from each family manifest's explicit `sources` entries.

Each record has `source`, `title`, `sha256`, `width`, `height`, `pages`, and `kind`.
Dimensions are the original SWF stage dimensions in pixels. `source` preserves
the case, spaces, spelling, and relative path of the recovery inventory.
`pages` preserves direct page references without inventing references for
loader-only children. `kind` is one of `activity`, `support`, `book`, or `media`.
It classifies the source artifact, not implementation status or fidelity.

`titleSource` identifies a title taken from a linked HTML label/image alt
(`html:<page>`) or a readable source basename (`filename`). Filename-derived
titles are deliberately not presented as recovered official titles. Short and
opaque original image alt attributes are rejected. Original typos may remain.
HTML scraping is a conservative offline extraction of this fixed archive, not
a general-purpose browser parser. Unlabeled image links and embedded objects
often fall back to filenames; no nearby unrelated heading is assigned to them.
Selected manually inspected recovered title fields use
`recovery:objects/.../resources/texts/<id>.txt`, including the original
English/Russian circle and sine/cosine law headings. Record separators are
normalized to spaces. Arbitrary first text fields are not used as titles.

Optional `thumbnail` is a relative public URL, `media/catalog/<hash>.<extension>`.
Consumers must resolve it against Vite's base URL for GitHub Pages. Thumbnails
are selected original raster previews inside links to the exact SWF. No visual
similarity matching or guessed cross-language associations are used. Missing
thumbnails are expected, particularly for loader children and embedded movies.

`src/content/previews.json` is a lightweight object mapping exact source paths
to preview paths relative to `public/media/`:
`{ "Movies/Circle.swf": "catalog/<hash>.<extension>" }`. It is generated directly
from catalog entries with thumbnails; sources without previews are omitted.
Unlike `legacy.json`'s `thumbnail` values, these paths have no `media/` prefix.
The eager gallery can import this map without loading the full source inventory;
resolve a value against the application's base URL plus `media/`.

`src/content/original-pages.json` holds source page names, headings, a small
selection of original introductory prose, attribution notes, and the media
manifest. Each media entry records the original relative path, public path,
SHA-256, and byte size. Do not treat this file's attribution notes as verbatim
HTML quotations. About/contact/privacy pages and contact-like text are excluded.

## Reproduce offline

Run from the project root:

```sh
node scripts/import-catalog.mjs
# Or supply both reference roots explicitly:
node scripts/import-catalog.mjs /path/to/site-archive /path/to/source-recovery
```

The importer reads `swf-recovery.json`, `site-usage.json`, and
`modernization-triage.json`, then verifies all archived SWF hashes. It writes
only the three generated JSON files and selected files under
`public/media/catalog/`. Archives are never modified. It needs only Node's
standard library, performs no network calls, and does not run archived code.
Inputs are expected to match the documented 207-object snapshot; a changed
inventory requires deliberate review.

Media selection is bounded to 256 KiB per file and 12 MiB total. Executable
archives, whole SWFs, external resources, analytics, and recovered resource trees
are not copied. Existing unrelated files are not deleted. A repeated run over
unchanged inputs is deterministic. Source hashes are identities, not permission
to redistribute; see `rights-and-provenance.md`.
