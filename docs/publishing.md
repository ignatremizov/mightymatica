# Pre-release publication and rollback

The owner authorized public-alpha publication on 2026-10-30. The independent
source repository is `ignatremizov/mightymatica`. This document records the
deployment contract; the actual deployed revision and verification belong in
the release record below.

## Static build

Use Node 24 and the committed npm lockfile:

```sh
npm ci
npm run check
npm run build
npm run preview
```

The application base is `/mightymatica/`. Hash bookmarks work without server
rewrites. Copy the contents of `dist/` to that public path, not the source tree.
Native families and original drawing modules load on demand. Book images, films,
and source illustrations are static files, not a backend.

For a combined local preview, first build both projects and then run:

```sh
npm run compose:portfolio -- /home/ignat/code/website/dist
```

The existing portfolio preview then serves `/mightymatica/`. Composition refuses
to overwrite an existing nested build. A fresh portfolio build removes the
composed output; compose again after rebuilding. This command neither changes
remote Pages settings nor publishes files.

No SWF, FLA, XFL, Java executable, Flash runtime, or emulator belongs in the
published artifact. Original archives and conversion caches remain local.

## Domain topology

MightyMatica's own workflow publishes `main` at
`https://ignatremizov.github.io/mightymatica/`; pull requests verify without
deploying. The portfolio's workflow checks out an approved immutable MightyMatica
revision, builds both repositories, and composes `dist/mightymatica/` before
publishing its combined Pages artifact. That delivers
`https://ignatremizov.com/mightymatica/` from the portfolio's domain without
requiring a user-site repository or cross-project domain inheritance.

`ignatremizov/website` Pages uses GitHub Actions, not its old legacy branch-folder
source. Its custom domain is `ignatremizov.com`. GitHub Pages owns the HTTPS
certificate; DNS validation and certificate issuance must complete before
enforcement and final HTTPS verification.

Relevant primary documentation:

- [Vite static deployment](https://vite.dev/guide/static-deploy.html)
- [GitHub Pages custom-domain inheritance](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)

The standalone and portfolio workflows run deterministic checks and production
artifact gates before deployment. The combined artifact must remain below the
conservative 1,000,000,000-byte Pages limit. All large media stays lazy-loaded;
corresponding-source archives remain in the source repository, outside `public`
and the hosted runtime artifact.

## Release gates

1. Review both working trees, native source coverage, and all intended untracked
   files. Do not include conversion caches or agent communication notes.
2. Complete static checks and production builds. Verify the intended artifacts
   rather than a stale preview.
3. Manually test representative diagrams, all puzzle families, keyboard/touch,
   reduced motion, background playback, book zoom, film sound, and Canvas language
   changes. No browser automation has been run.
4. Review attribution and distribution rights for the original cartoon artwork,
   Escher imagery, soundtracks, and books. A preserved download does not itself
   establish redistribution permission.
5. Retain the LGPLv3 `ffdec_lib` runtime notices, both license texts and the
   corresponding-source package under `third-party/ffdec`. The About page links
   the public notice and source repository. The FFDec application's GPL license
   must not be confused with its exported library's LGPL terms. Runtime notices
   neither grant a blanket media license nor assert comprehensive media clearance.
6. Owner publication approval is recorded above. Keep DNS changes limited to the
   website's apex and `www`; never change email or unrelated tunnel records.
7. Verify the public HTML, `/mightymatica/` asset base, an activity bookmark,
   one book page, one film, and one native drawing module on the actual host.
8. Record the deployed commit and a known-good rollback artifact. Roll back by
   deploying a reviewed previous commit, or by dispatching the portfolio workflow
   with the previous MightyMatica revision. Do not hard-reset a dirty worktree.

## First preview is not full parity

Source coverage records which original objects have a modern representation.
It does not certify every narration, source button, illustrated transition,
audio envelope, or accessibility description has been matched. Module-specific
notes in `docs/modules/` distinguish those remaining tasks.

## Release verification, 2026-10-30

- `npm run check` passed TypeScript verification and 222 tests, with one explicit
  renderer-proof opt-in skipped by default. That proof passed separately.
- `npm run build` passed its coverage, native-only artifact, public-base, and
  eager-transfer checks. The report lists 143 activities, 20 families, 203
  represented source objects, and four intentionally excluded support objects.
- The portfolio passed its own TypeScript checks, 252 tests, and production
  loading/transfer gates. Both builds were composed for local preview.
- Local HTTP checks matched the root, nested entry, scripts, social image and
  changed native media to built bytes. The internal restoration report is not
  included in either public artifact. Actual public-host checks are recorded
  after deployment.

These checks did not include browser automation or an independent claim of
visual parity. The owner accepted the current UI for sharing; further UI/UX
refinements and documented fidelity gaps can follow the alpha.

## Update verification, 2026-10-31

The owner authorized committing and publishing the current restoration update.
The restoration remains beta/pre-release; the separate portfolio remains alpha.
This update restores the original five-phase cube-sections sequence, connects
painted lesson controls, keeps hints in the current presentation, and reduces
repeated native text/filter work without removing the authored effects.

- `npm run check` passed TypeScript verification and 266 tests, with one
  explicitly opt-in renderer proof skipped.
- `npm run build` passed all source-coverage, native-only, public-base and
  eager-transfer gates: 143 activities in 20 families and 203 content objects.
- The portfolio passed TypeScript verification, all 252 tests, and its
  production loading and transfer gates.
- Both dependency audits, including development dependencies, reported zero
  known vulnerabilities.
- The combined Pages artifact contains 3,193 files totaling 795,990,276 bytes,
  below the conservative 1 GB gate. An isolated build preserved the running
  local preview.
- The refreshed LGPL corresponding-source package has 186 readable baselines
  and 499 supporting files. All baseline, final-module, support-file and split
  archive hashes, archive integrity and archive paths were verified.
- DNS and the Pages HTTPS certificate were already configured; no DNS changes
  were needed.

These are build and source checks, not new browser, listening or pixel-parity
certification. Public deployment and HTTP delivery are verified after pushing.
The previous published MightyMatica revision
`382efbdd72a6a62540abcaeadd662ec70113f2fd` remains a rollback target.
