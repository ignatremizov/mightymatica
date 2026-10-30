import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { patchReviewedPlaybackControl } from "./reviewed-playback-control.mjs";

// Verified pp classes: local frame 0 stops with go/bControl; local frame 1
// stops with halt/sButton. Their handlers play/stop root and select 2/1.
const variants = [
  ["false-proof", "en", "Alltriangles", 18], ["false-proof", "ru", "Alltriangles-ru", 17],
  ["congruence", "en", "Congruence", 31], ["congruence", "ru", "Congruence-ru", 29],
  ["pythagoras", "en", "Pifagor-gl", 19], ["pythagoras", "ru", "Pifagoras Theorem - ru", 35],
  ["medians", "en", "Mediana", 23], ["medians", "ru", "Mediana-ru", 22],
  ["altitudes", "en", "Altitudes", 24], ["altitudes", "ru", "Altitudes-ru", 23],
  ["bisectors", "en", "Bisector", 23], ["bisectors", "ru", "Bisector-ru", 23],
  ["cosine-law", "en", "Coslaw", 16], ["cosine-law", "ru", "Coslaw-ru", 16],
  ["sine-law", "en", "Sinlaw", 16], ["sine-law", "ru", "Sinlaw-ru", 16],
  ["inscribed-angle", "en", "Insangle", 54], ["inscribed-angle", "ru", "Insangle-ru", 46],
  ["trig-addition", "en", "Trig-cos", 16], ["trig-addition", "ru", "Trig-cos-ru", 16],
  ["palm-trig", "en", "Palmandtrig", 26],
];

export function patchTrianglePlaybackControl(source, title, locale) {
  const variant = variants.find(entry => entry[0] === title && entry[1] === locale);
  if (!variant) throw new Error("Expected a reviewed triangle source variant.");
  return patchReviewedPlaybackControl(source, {
    spriteNames: [`sprite${variant[3]}`],
    stateName: "trianglePlaybackPlaying",
    marker: "// Triangle playback control v1: reviewed source pp follows native transport.\n",
  });
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const mode = process.argv[2];
  if (mode === "--recover-controls") {
    // Reuse the reviewed structured XML reader; it only reads archive files.
    const python = String.raw`
import json, runpy, sys
from pathlib import Path
reader=runpy.run_path(str(Path(sys.argv[1])/'src/modules/calculus/recover-controls.py'))
rows=[]
for title,locale,name,sprite in json.load(sys.stdin):
    data=reader['recover'](name,f'Symbol {sprite}')
    folder=reader['ARCHIVE']/name
    symbol=next((folder/'project').rglob(f'LIBRARY/Symbol {sprite}.xml'))
    item=reader['ET'].parse(symbol).getroot()
    cls=item.get('linkageClassName')
    source=next((folder/'actionscript/scripts').rglob(cls.split('.')[-1]+'.as')).read_text()
    for text in ['gotoAndStop(2)','gotoAndStop(1)','root).play()','root).stop()']:
        if text not in source: raise ValueError(f'Unverified transport handler: {name}')
    if not reader['re'].search(r'addFrameScript\(0,.*?1,',source):
        raise ValueError(f'Unverified transport frames: {name}')
    children=data['children']
    if {child['state'] for child in children}!={'play','pause'}:
        raise ValueError(f'Unexpected transport states: {name}')
    placements=[]
    for place in data['placements']:
        if place['id']!='pp': continue
        if place['symbol']!=f'Symbol {sprite}': raise ValueError('Unexpected pp class')
        def rect(bounds):
            x,y,right,bottom=bounds
            return dict(x=round(x,5),y=round(y,5),width=round(right-x,5),height=round(bottom-y,5))
        boxes=list(place['rects'].values())
        union=[min(b[0] for b in boxes),min(b[1] for b in boxes),
               max(b[2] for b in boxes),max(b[3] for b in boxes)]
        placements.append(dict(firstFrame=place['startFrame'],lastFrame=place['endFrame'],
                               play=rect(place['rects']['play']),transport=rect(union)))
    rows.append(dict(key=f'{title}:{locale}',source=f'Movies/{name}.swf',
                     sprite=f'sprite{sprite}',sourceClass=cls,
                     placements=sorted(placements,key=lambda p:p['firstFrame'])))
print(json.dumps(rows))
`;
    const result = spawnSync("python3", ["-c", python, root], {
      input: JSON.stringify(variants), encoding: "utf8", maxBuffer: 2 * 1024 * 1024,
    });
    if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr);
    const controls = JSON.parse(result.stdout);
    await writeFile(resolve(root, "src/modules/triangles/source-controls.json"), JSON.stringify(controls, null, 2) + "\n");
    console.log(`Recovered ${controls.length} verified source transports; archives unchanged.`);
    return;
  }
  if (!["--check", "--apply"].includes(mode)) throw new Error("Use --recover-controls, --check or --apply.");
  const changes = [];
  for (const [title, locale] of variants) {
    const definition = JSON.parse(await readFile(resolve(root, `src/modules/triangles/native-${title}-${locale}.json`), "utf8"));
    for (const chapter of definition.chapters) {
      const filename = resolve(root, "public/media", chapter.module);
      if (!filename.startsWith(resolve(root, "public/media/triangles/native") + "/")) throw new Error("Unexpected triangle media path.");
      const source = await readFile(filename, "utf8");
      if (!source.includes("// Canvas context transforms v1:")) throw new Error("Wait for the shared CTM correction before patching.");
      const patched = patchTrianglePlaybackControl(source, title, locale);
      changes.push({ filename, source, patched });
    }
  }
  // Validate every configuration before writing any generated module.
  if (mode === "--apply") for (const change of changes) {
    if (change.source !== change.patched) await writeFile(change.filename, change.patched);
  }
  console.log(`${mode}: ${variants.length} verified variants, ${changes.length} native chapters; ${changes.filter(change => change.source !== change.patched).length} ${mode === "--apply" ? "patched" : "would change"}.`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
