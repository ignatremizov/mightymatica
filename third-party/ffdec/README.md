# FFDec Canvas runtime corresponding source

Release modification date: **2026-10-31**.

The exported `canvas.js` runtime comes from JPEXS Free Flash Decompiler 26.2.1's
`ffdec_lib`, licensed under GNU LGPL version 3. The application's separate GPL
license is not the evidence used to identify this library's license.
Upstream library license:
https://github.com/jindrapetrik/jpexs-decompiler/blob/version26.2.1/libsrc/ffdec_lib/license.txt
Upstream source:
https://github.com/jindrapetrik/jpexs-decompiler/tree/version26.2.1/libsrc/ffdec_lib

`canvas-original.js` preserves the upstream “JPEXS Free Flash Decompiler Filters”
header and runtime as extracted from the installed 26.2.1 library.
Copies of LGPL-3.0 and its GPL-3.0 companion text are in `public/licenses/`.

## Modified runtime and preferred editing sources

The restoration modifies the exported library for native ES modules, explicit
Canvas ownership/lifecycle, safe symbol dispatch, context transforms, local
fonts, playback and bounded filter/frame processing. The readable converter and
patch implementation sources are the repository's `scripts/*.mjs`; source
snapshots are also included in the archive. These are modifications by the
MightyMatica restoration contributors, dated above, not upstream behavior.

The split xz archive contains 186 readable, unminified converted baselines,
the three remaining cube modules, converter/patcher/minifier sources, shared
runtime and family recovery sources, configuration, dependency lockfile,
licenses, and a SHA-256 manifest. The baseline is already a converted native module:
reconstruction does **not** require a SWF, FLA, private archive, Java or FFDec.
Embedded drawing and image content remains subject to its independent rights.

To unpack the readable source in an empty working folder:

```sh
sha256sum -c SHA256SUMS
cat native-source.tar.xz.part-* > native-source.tar.xz
tar -xJf native-source.tar.xz
mkdir -p reconstructed
cp -R baseline/public reconstructed/
cp -R support/public/media/. reconstructed/public/media/
```

Verify `reconstructed/<record.path>` against `baselineSha256` in
`manifest.json`. `source-manifest.json` is a separately readable copy.
The exact final text, including all later edits, is already published at each
record's `path` in this repository; `finalSource` links to it and `finalSha256`
identifies the snapshot. Use the matching release checkout if `main` has moved.
Compare these files with the readable baseline and the relevant patcher source
to inspect modifications. Whole-file minified replacement patches are omitted:
they duplicate the drawing/image payload already supplied in `public/media`.
The baseline is an editable pre-minification form, not a claim that rerunning
one command recreates every subsequent manual edit.

For semantic editing use the readable baselines, `support/scripts/`, and
`support/src/` sources. The latter includes the current bounded-filter helper,
family optimization evidence, source-control metadata, and lesson controllers.
With Node.js and locked dependencies installed,
`scripts/minify-native-drawings.mjs` exposes `minifyReviewed`; its CLI supports
`INPUT.mjs OUTPUT.mjs`. Other patchers document their entry points in source.
These source forms permit modifying/recombining the library in the native app;
the app does not require a signature or installation key for modified modules.

Maintainers can regenerate the staging tree with
`node third-party/ffdec/package-source.mjs` while the local verified baseline
cache exists, then archive `.cache/ffdec-readable-source-2026-10-31-final/` with
`tar -cf - . | xz -T2 -3` and split the output into 40 MiB parts.
Consumers use the published
archive instead; the private cache is not a consumer prerequisite.
No original Flash executables, authored FLA files, JARs, or private archive trees
are included. This package does not assert media clearance or apply LGPL/GPL
to independently written application code or original mathematical artwork.
