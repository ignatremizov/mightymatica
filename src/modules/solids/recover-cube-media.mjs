#!/usr/bin/env node
// Source-specific, offline Cubesections recovery. Never executes ActionScript.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { parse } from "acorn";
import { patchReviewedPlaybackControl } from "../../../scripts/reviewed-playback-control.mjs";
import { patchCalculusFilters } from "../../../scripts/optimize-calculus-filters.mjs";

const root = resolve(import.meta.dirname, "../../..");
const archive = "/home/ignat/code/mightymatica-source-recovery/objects/Movies";
const mode = process.argv[2];
if (!["--proof", "--recover"].includes(mode)) throw new Error("Use --proof (EN only) or --recover.");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", ...options });
  if (result.error || result.status !== 0) throw result.error ?? new Error(`${command} failed: ${result.status}`);
  return result.stdout;
}

// Reuse the reviewed structured XML/hit-record reader. SVG export wrappers
// normalize artwork into positive coordinates; local paths deliberately omit
// that wrapper so native 3D uses the original Flash registration.
const xmlReader = String.raw`
import json,runpy,sys,re
from pathlib import Path
import xml.etree.ElementTree as E
root=Path(sys.argv[1]); name=sys.argv[2]
helpers=runpy.run_path(str(root/'src/modules/calculus/recover-controls.py'))
base=helpers['ARCHIVE']/name; ns=helpers['NS']
project=base/'project'/f'{name}.xfl'/name
doc=E.parse(project/'DOMDocument.xml').getroot()
def symbol(n): return E.parse(project/'LIBRARY'/f'{n}.xml').getroot()
phases=[]
for scene in doc.findall('./x:timelines/x:DOMTimeline',ns)[:4]:
    instances=scene.findall('.//x:DOMSymbolInstance',ns)
    cube=next(i for i in instances if i.get('name')=='cube')
    children=[]
    layers=symbol(cube.get('libraryItemName')).findall('./x:timeline/x:DOMTimeline/x:layers/x:DOMLayer',ns)
    for layer in reversed(layers):
        child=layer.find('.//x:DOMSymbolInstance',ns)
        direct=layer.find('.//x:DOMShape',ns)
        if child is None and direct is None: continue
        item=symbol(child.get('libraryItemName')) if child is not None else layer
        childmatrix=helpers['matrix'](child) if child is not None else [1,0,0,1,0,0]
        nesting=[]
        shape=item.find('.//x:DOMShape',ns)
        while shape is None:
            nested=item.findall('.//x:DOMSymbolInstance',ns)
            if len(nested)!=1 or len(nesting)>3: raise ValueError('Unexpected nested art')
            nesting.append(helpers['matrix'](nested[0]))
            item=symbol(nested[0].get('libraryItemName'))
            shape=item.find('.//x:DOMShape',ns)
        # The recovered symbol resource's ID identifies the underlying shape.
        # Each reviewed cube child contains exactly one static shape.
        if shape is None: raise ValueError('Expected static child shape')
        edges=shape.findall('.//x:Edge',ns)
        fills=shape.findall('./x:fills/x:FillStyle/x:SolidColor',ns)
        strokes=shape.findall('./x:strokes/x:StrokeStyle/x:SolidStroke',ns)
        if len(edges)!=1 or len(fills)!=1 or len(strokes)!=1: raise ValueError('Expected one polygon')
        edge=edges[0].get('edges')
        if re.search(r'[^!| 0-9.\-]',edge): raise ValueError('Expected straight numeric polygon')
        values=[float(v)/20 for v in re.findall(r'-?\d+(?:\.\d+)?',edge)]
        points=list(zip(values[::2],values[1::2]))
        def point(p,m): return [m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]]
        for m in reversed(nesting): points=[point(p,m) for p in points]
        points=[point(p,childmatrix) for p in points]
        stroke=strokes[0]; strokeColor=stroke.find('.//x:SolidColor',ns)
        children.append(dict(symbol=child.get('libraryItemName') if child is not None else 'direct section shape',matrix=childmatrix,
            points=points,fill=fills[0].get('color'),fillOpacity=float(fills[0].get('alpha','1')),
            stroke=strokeColor.get('color'),strokeWidth=float(stroke.get('weight')),
            edges=[e.attrib for e in edges],fills=[f.attrib for f in fills],
            strokes=[dict(s.attrib,colors=[c.attrib for c in s.findall('.//x:SolidColor',ns)]) for s in strokes]))
    phases.append(dict(scene=scene.get('name'),symbol=cube.get('libraryItemName'),
        matrix=helpers['matrix'](cube),alpha=.55078125,children=children))
controls=helpers['recover'](name,'Symbol 70')
transport=symbol('Symbol 70')
cls=transport.get('linkageClassName')
script=next((base/'actionscript/scripts').rglob(cls.split('.')[-1]+'.as')).read_text()
for fragment in ['gotoAndStop(2)','gotoAndStop(1)','root).play()','root).stop()']:
    if fragment not in script: raise ValueError('Unreviewed source transport')
if not re.search(r'addFrameScript\(0,.*?1,',script): raise ValueError('Unreviewed transport frames')
scene5=doc.findall('./x:timelines/x:DOMTimeline',ns)[4]
dependencies=set()
def visit(n):
    if n in dependencies: return
    dependencies.add(n)
    item=symbol(n)
    if item.get('linkageClassName') and n!='Symbol 70': raise ValueError('Unexpected Scene5 script-owned art')
    for i in item.findall('.//x:DOMSymbolInstance',ns): visit(i.get('libraryItemName'))
for i in scene5.findall('.//x:DOMSymbolInstance',ns): visit(i.get('libraryItemName'))
hits=helpers['text_button_hits'](base,name)
nexts=[]
for scene in doc.findall('./x:timelines/x:DOMTimeline',ns)[:4]:
    i=next(i for i in scene.findall('.//x:DOMSymbolInstance',ns) if i.get('name')=='bHint')
    nexts.append(helpers['transform'](hits[i.get('libraryItemName')],helpers['matrix'](i)))
print(json.dumps(dict(phases=phases,controls=controls,nextBounds=nexts)))
`;
const languages = {};
for (const locale of mode === "--proof" ? ["en"] : ["en", "ru"]) {
  const name = `Cubesections${locale === "ru" ? "-ru" : ""}`;
  const source = `${archive}/${name}/original/${name}.swf`;
  const cache = resolve(root, `.cache/cube-lesson/${locale}/${mode.slice(2)}`);
  await mkdir(cache, { recursive: true });
  const frames = mode === "--proof" ? "9,120,600,1248" : "1-1248";
  run(process.execPath, ["scripts/export-original-frames.mjs", "--source", source,
    "--frames", frames, "--output", cache, "--format", "canvas"]);
  const target = resolve(root, `public/media/solids/cube-lesson/${locale}/${mode === "--proof" ? "proof" : "timeline"}.mjs`);
  run(process.execPath, ["scripts/convert-canvas-export.mjs", cache, target]);
  let drawing = await readFile(target, "utf8");
  if (mode === "--proof") {
    console.log("EN proof is drawing-only; inspect distinct baked paths/morphs and XFL Scene 5 dependencies before --recover.");
    continue;
  }
  const raw = run("python3", ["-c", xmlReader, root, name], { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  const evidence = JSON.parse(raw);
  // Strip only the four timer-driven cube placements from roots 1–8.
  // Everything else (source NEXT buttons and original text) stays authored.
  const ast = parse(drawing, { ecmaVersion: "latest", sourceType: "module" });
  const factory = ast.body.find(n => n.declaration?.id?.name === "createTimeline").declaration;
  function find(node, predicate) {
    if (!node || typeof node !== "object") return;
    if (predicate(node)) return node;
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) { const result = find(child, predicate); if (result) return result; }
      } else if (value && typeof value === "object") {
        const result = find(value, predicate); if (result) return result;
      }
    }
  }
  const main = find(factory, n => n.type === "FunctionDeclaration" && n.id.name === "main");
  const dispatch = main.body.body.find(n => n.type === "SwitchStatement");
  const edits = [];
  for (const entry of dispatch.cases.filter(n => n.test.value < 8)) {
    const expected = `sprite${[15, 34, 45, 56][Math.floor(entry.test.value / 2)]}`;
    const placements = entry.consequent.filter(n => n.type === "ExpressionStatement"
      && n.expression.callee?.name === "place" && n.expression.arguments[0]?.value === expected);
    if (placements.length !== 1) throw new Error(`Unexpected phase cube ${expected}`);
    edits.push(placements[0]);
  }
  if (edits.length !== 8) throw new Error("Expected all eight phase roots.");
  for (const edit of edits.sort((a, b) => b.start - a.start)) drawing = drawing.slice(0, edit.start) + drawing.slice(edit.end);
  drawing = patchReviewedPlaybackControl(drawing, { spriteNames: ["sprite70"],
    stateName: "cubePlaybackPlaying",
    marker: "// Cubesections pp_37/symbol70: reviewed two-frame root transport.\n" });
  const boundsFile = resolve(cache, "text-bounds.json");
  run(process.execPath, ["scripts/recover-calculus-text-bounds.mjs", "--en", source, "--ru", source, "--output", boundsFile]);
  const bounds = JSON.parse(await readFile(boundsFile, "utf8"));
  drawing = patchCalculusFilters(drawing, bounds.languages.en.textBounds, 550, 400).source;
  await writeFile(target, drawing);
  run(process.execPath, ["--check", target]);
  const placements = evidence.controls.placements.filter(p => p.id === "pp").map(p => {
    const boxes = Object.values(p.rects);
    const x = Math.min(...boxes.map(b => b[0])), y = Math.min(...boxes.map(b => b[1]));
    return { firstFrame: p.startFrame, lastFrame: p.endFrame,
      transport: { x, y, width: Math.max(...boxes.map(b => b[2])) - x, height: Math.max(...boxes.map(b => b[3])) - y } };
  });
  languages[locale] = {
    source: `Movies/${name}.swf`, sourceSha256: sha(await readFile(source)),
    width: 550, height: 400, fps: 24, frameCount: 1248, initialFrame: 9, endFrame: 1248,
    chapters: [{ id: "sections", startFrame: 1, endFrame: 1248, module: `solids/cube-lesson/${locale}/timeline.mjs` }],
    stops: [{ frame: 9, kind: "manual" }, { frame: 1248, kind: "complete" }],
    audioAssets: [], audioCues: [], playbackControls: placements,
    nativeScenes: evidence.phases, nextBounds: evidence.nextBounds,
    playbackHotspot: placements[0].transport,
    geometryCoordinateSpace: "Flash local coordinates; XFL edges in twips (divide by 20); children in display-list order",
  };
  console.log(`${locale}: ${drawing.length} bytes; exact source paths, transport and ${evidence.phases.length} phase registrations recovered.`);
}
if (mode === "--recover") {
  if (JSON.stringify(languages.en.nativeScenes) !== JSON.stringify(languages.ru.nativeScenes)) throw new Error("Unexpected geometry locale difference.");
  await writeFile(resolve(root, "src/content/cube-sections-media.json"), JSON.stringify({ version: 1,
    frameNumbering: "one-based-global", languages }, null, 2) + "\n");
}
