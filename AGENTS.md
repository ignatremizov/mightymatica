# MightyMatica restoration

This is a standalone, client-only restoration of Yuri Remizov's MightyMatica
collection. React, TypeScript, and Vite provide the shell; activities use semantic
HTML, SVG, Canvas, and optional lazy Three.js. The target is GitHub Pages at
`/mightymatica/`. No backend, accounts, telemetry, or Flash dependency is required.

## Preservation and ownership

- Original site: `/home/ignat/code/mightymatica-archive-2026-08-09`.
- Recovered source: `/home/ignat/code/mightymatica-source-recovery`.
- Both archives are read-only references. Never modify, rename, or hard-link
  editable files into them. Inspect the recovered scripts, text, and timeline
  before implementing an activity. Do not infer a complete lesson from its title.
- You are not alone in this repository. Edit only your assigned files and preserve
  other workers' changes. Main owns shell integration and shared contracts.
- Keep original attribution and distinguish a native adaptation from an exact
  restoration. Do not label unimplemented material playable.
- Match the original Flash applet UX as closely as possible unless the user
  explicitly requests a deviation. Preserve initial questions, prerequisites,
  answer gates, teaching sequence, authored layout, and direct drag, draw, and
  playback interactions; inspect source evidence before changing those flows.
- Accessible keyboard/touch alternatives, pause controls, and inspection tools
  may supplement the source interaction, not replace it or reveal answers early.
  Document current fidelity gaps as restoration work, not approved redesigns.
  Record explicit user overrides separately; in particular, the user-requested
  freeform jigsaw with snapped movable groups overrides original wrong-return /
  correct-lock behavior and must not be reverted in pursuit of source parity.
- Do not grant a blanket license to recovered third-party illustrations or audio.
- Do not create remote repositories, push, deploy, or commit unless Main requests it.

## Structure

```text
src/app/                 Catalog, routing, preferences, and activity host
src/shared/              Types, accessible controls, and animation lifecycle
src/modules/<family>/    Family manifest, native activities, pure rules
src/content/             Generated source inventory and restoration metadata
public/media/            Selected, attributed original assets
scripts/                 Repeatable import, inventory, and build checks
tests/                   Deterministic rule/regression tests
docs/                    Restoration status, provenance, and release instructions
```

Each family exports `manifest` from `manifest.ts` and a default React component
from `index.tsx`. Use `ActivityMeta` and `ActivityProps` in
`src/shared/contracts.ts`. Activity IDs are stable, kebab-case, and globally
unique. Never import the application composition root from a module.

Keep manifests free of React, canvas, DOM, and Three.js runtime imports. The shell
loads a family only when an activity opens. Do not import the portfolio game.

Use SVG for crisp mathematical diagrams and semantic DOM controls. Canvas games
need equivalent instructions, status, and keyboard controls. Share a coherent
rule rather than duplicating one across language variants. Preserve both English
and Russian where verified source translations exist.

## Runtime and verification

- No browser automation or Playwright unless the user explicitly requests it.
- Main runs integrated type-check/build/tests. Workers must not launch repeated
  compilers, development servers, or full test suites concurrently.
- Add focused, deterministic tests for nontrivial rules or observed regressions.
  Avoid tests of React/JavaScript/library behavior, static coordinates, and colors.
- Preserve the user's Play/Pause choice across focus changes and tab switching:
  already-started animation, narration and media continue in the background.
  Keep background work bounded and avoid expensive hidden Canvas redraws.
  Cancel active pointer gestures on blur/hide, not playback. Clean up timers,
  animation frames, listeners, audio and GPU resources on unmount.
- Honor reduced motion. Do not autoplay audio. Avoid routine allocations and
  React state updates per particle per frame.
- Use `apply_patch` for edits. No destructive Git operations.
- Report exact changed files, source artifacts examined, real checks performed,
  and fidelity/visual limitations. Do not claim browser verification.
