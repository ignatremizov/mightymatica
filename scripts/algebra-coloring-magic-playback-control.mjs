// Reviewed source controls only. No SWF, ActionScript or drawing factory executes.
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { patchReviewedPlaybackControl } from "./reviewed-playback-control.mjs";

const variants = [
  ["algebra", "transform", "Algbra trans", 41, []],
  ["algebra", "quadratic", "Quadratic eq", 63, ["bt1", "bt2", "bt3", "bt4", "bt5", "bt6"]],
  ["coloring", "coloring-two-plane:en", "Twocolorplane-eng", 22, ["bHint"]],
  ["coloring", "coloring-two-plane:ru", "Twocolorplane", 22, ["bHint"]],
  ["coloring", "coloring-segment:en", "Twocolorplaneseg-en", 22, ["bHint"]],
  ["coloring", "coloring-segment:ru", "Twocolorplaneseg-ru", 22, ["bHint"]],
  ["coloring", "coloring-equilateral:en", "Twocoloreqtri-eng", 22, ["bHint"]],
  ["coloring", "coloring-equilateral:ru", "Twocoloreqtri-ru", 22, ["bHint"]],
  ["coloring", "coloring-three-plane:en", "Threecolorplane-eng", 23, ["bHint"]],
  ["coloring", "coloring-three-plane:ru", "Threecolorplane-ru", 23, ["bHint"]],
  ["magic", "hourglasses:en", "Twohourglasses", null, ["bHint"]],
  ["magic", "hourglasses:ru", "Twohourglasses-ru", null, ["bHint"]],
];
const sha = value => createHash("sha256").update(value).digest("hex");

export function patchAlgebraColoringPlaybackControl(source, family, key) {
  const variant = variants.find(row => row[0] === family && row[1] === key && row[3] !== null);
  if (!variant) throw new Error("Expected a reviewed algebra/coloring source transport.");
  return patchReviewedPlaybackControl(source, {
    spriteNames: [`sprite${variant[3]}`],
    stateName: "familyPlaybackPlaying",
    marker: "// Algebra/coloring playback control v1: reviewed source pp follows native transport.\n",
  });
}

async function recover(root) {
  const python = String.raw`
import json,runpy,sys,hashlib
from pathlib import Path
reader=runpy.run_path(str(Path(sys.argv[1])/'src/modules/calculus/recover-controls.py'))
def recover_tag_controls(name,sprite):
    # Coloring's XFL folders are empty in this archive. Read its preserved
    # FFDec tag model directly; do not regenerate or write preservation files.
    folder=reader['ARCHIVE']/name
    xml=folder/'tag-model'/f'{name}.swf.xml'
    source=reader['ET'].parse(xml).getroot()
    tags=source.find('tags')
    definitions={}
    for tag in tags:
        for attribute in ['shapeId','characterID','buttonId','spriteId']:
            if tag.get(attribute) is not None and tag.get('type','').startswith('Define'):
                if tag.get('type')=='DefineButtonSoundTag': continue
                definitions[int(tag.get(attribute))]=tag
    def matrix(node):
        return [float(node.get(k,str(default))) for k,default in
                [('scaleX',1),('rotateSkew0',0),('rotateSkew1',0),('scaleY',1),
                 ('translateX',0),('translateY',0)]]
    def transformed(box,m):
        # Matrix translations and shape RECTs are SWF twips until here.
        m=m[:4]+[m[4]/20,m[5]/20]
        return reader['transform'](box,m)
    def bounds(identity):
        tag=definitions[identity]
        if tag.get('type')=='DefineButton2Tag':
            boxes=[transformed(bounds(int(child.get('characterId'))),matrix(child.find('placeMatrix')))
                   for child in tag.find('characters') if child.get('buttonStateHitTest')=='true']
            if not boxes: raise ValueError('Missing source button Hit record')
            return [min(b[0] for b in boxes),min(b[1] for b in boxes),
                    max(b[2] for b in boxes),max(b[3] for b in boxes)]
        box=tag.find('edgeBounds')
        if box is None: box=tag.find('shapeBounds')
        if box is None: box=tag.find('textBounds')
        if box is None: raise ValueError(f'Unsupported reviewed Hit child: {identity}')
        return [float(box.get(k))/20 for k in ['Xmin','Ymin','Xmax','Ymax']]
    transport=definitions[sprite]
    if transport.get('frameCount')!='2': raise ValueError('Expected two source pp frames')
    children=[]
    for tag in transport.find('subTags'):
        if tag.get('name') not in ['go','halt']: continue
        children.append(dict(state='play' if tag.get('name')=='go' else 'pause',
                             transportBounds=transformed(bounds(int(tag.get('characterId'))),matrix(tag.find('matrix')))))
    placements=[]
    active={}
    frame=1
    for tag in tags:
        kind=tag.get('type')
        if kind=='ShowFrameTag':
            frame+=1
            continue
        if kind not in ['PlaceObject2Tag','PlaceObject3Tag','RemoveObject2Tag']: continue
        depth=tag.get('depth')
        if depth in active and (kind=='RemoveObject2Tag' or tag.get('placeFlagHasCharacter')=='true'):
            active.pop(depth)['endFrame']=frame-1
        if tag.get('name') not in ['pp','bHint']: continue
        identity=tag.get('name')
        place=dict(id=identity,startFrame=frame,endFrame=int(source.get('frameCount')),
                   symbol=f"Symbol {tag.get('characterId')}")
        placement=matrix(tag.find('matrix'))
        if identity=='pp':
            if int(tag.get('characterId'))!=sprite: raise ValueError('Unexpected pp symbol')
            place['rects']={child['state']:transformed(child['transportBounds'],placement) for child in children}
        else: place['rect']=transformed(bounds(int(tag.get('characterId'))),placement)
        placements.append(place)
        active[depth]=place
    return dict(children=children,placements=placements)
rows=[]
for family,key,name,sprite,extra in json.load(sys.stdin):
    folder=reader['ARCHIVE']/name
    document=next((folder/'project').rglob('DOMDocument.xml'),None)
    data=(recover_tag_controls(name,sprite) if document is None and family=='coloring'
          else reader['recover'](name,f'Symbol {sprite}' if sprite else None,extra))
    main=next((folder/'actionscript/scripts').rglob('MainTimeline.as')).read_text()
    cls=None
    if sprite:
        if document:
            item=reader['ET'].parse(document.parent/'LIBRARY'/f'Symbol {sprite}.xml').getroot()
            cls=item.get('linkageClassName')
            script=next((folder/'actionscript/scripts').rglob(cls.split('.')[-1]+'.as')).read_text()
        else:
            candidates=[file for file in (folder/'actionscript/scripts').rglob('pp_*.as')
                        if f'symbol="symbol{sprite}"' in file.read_text()]
            if len(candidates)!=1: raise ValueError('Ambiguous reviewed pp class')
            cls=candidates[0].stem
            script=candidates[0].read_text()
        for text in ['gotoAndStop(2)','gotoAndStop(1)','root).play()','root).stop()',
                     'this.go.addEventListener(MouseEvent.CLICK,this.startplaying)',
                     'this.halt.addEventListener(MouseEvent.CLICK,this.stopplaying)']:
            if text not in script: raise ValueError(f'Unverified transport: {name}')
        if 'addFrameScript(0,this.frame1,1,this.frame2)' not in script:
            raise ValueError(f'Unverified two-frame transport: {name}')
        if {child['state'] for child in data['children']}!={'play','pause'}:
            raise ValueError('Unexpected transport states')
    def rect(bounds):
        x,y,right,bottom=bounds
        return dict(x=round(x,5),y=round(y,5),width=round(right-x,5),height=round(bottom-y,5))
    row=dict(family=family,key=key,source=f'Movies/{name}.swf',
             sourceSha256=hashlib.sha256((folder/'original'/f'{name}.swf').read_bytes()).hexdigest(),
             sprite=f'sprite{sprite}' if sprite else None,sourceClass=cls,
             playbackHotspots=[],actionHotspots={},navigationMenus=[])
    for place in data['placements']:
        if place['id']=='pp':
            if place['symbol']!=f'Symbol {sprite}': raise ValueError('Unexpected pp class')
            boxes=list(place['rects'].values())
            union=[min(b[0] for b in boxes),min(b[1] for b in boxes),
                   max(b[2] for b in boxes),max(b[3] for b in boxes)]
            row['playbackHotspots'].append(dict(firstFrame=place['startFrame'],lastFrame=place['endFrame'],**rect(union)))
        elif place['id']=='bHint':
            expected=347 if key.startswith('coloring-three-plane:') else 321
            if family=='magic':
                if place.get('resumeFrames')!=[765]: raise ValueError('Unverified hourglass resume')
            elif not reader['re'].search(r'function starthint[^}]+gotoAndPlay\('+str(expected)+r'\)',main):
                raise ValueError('Unverified plane Hint target')
            row['actionHotspots']['bHint']=dict(sourceArtwork=True,**rect(place['rect']))
        elif place['id'].startswith('bt'):
            index=int(place['id'][2:])-1
            target=[37,851,1058,1312,1646,2646][index]
            if not reader['re'].search(r'function shoot'+str(index+1)+r'[^}]+gotoAndPlay\('+str(target)+r'\)',main):
                raise ValueError('Unverified quadratic chapter target')
            if not reader['re'].search(r'function frame37[^}]+this\.bt'+str(index+1)+
                                      r'\.addEventListener\(MouseEvent.CLICK,this\.shoot'+str(index+1)+r'\)',main):
                raise ValueError('Unverified quadratic chapter handler')
            menu=next((m for m in row['navigationMenus'] if m['firstFrame']==place['startFrame']
                       and m['lastFrame']==min(place['endFrame'],4030)),None)
            if menu is None:
                menu=dict(firstFrame=place['startFrame'],lastFrame=min(place['endFrame'],4030),items=[])
                row['navigationMenus'].append(menu)
            menu['items'].append(dict(chapter=index+1,targetFrame=target,**rect(place['rect'])))
    if sprite and len(row['playbackHotspots'])!=1: raise ValueError('Unreviewed pp placement count')
    if family=='coloring' and (row['playbackHotspots'][0]['firstFrame']!=1 or
                               row['playbackHotspots'][0]['lastFrame']!=1):
        raise ValueError('Plane pp must exist only at the initial source frame')
    if extra==['bHint'] and set(row['actionHotspots'])!={'bHint'}:
        raise ValueError('Missing source Hint')
    if key=='quadratic' and sum(len(m['items']) for m in row['navigationMenus'])!=6:
        raise ValueError('Incomplete quadratic chapter menu')
    for menu in row['navigationMenus']: menu['items'].sort(key=lambda item:item['chapter'])
    rows.append(row)
print(json.dumps(rows))
`;
  const result = spawnSync("python3", ["-c", python, root], {
    input: JSON.stringify(variants), encoding: "utf8", maxBuffer: 2 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw result.error ?? new Error(result.stderr);
  const rows = JSON.parse(result.stdout);
  for (const family of ["algebra", "coloring", "magic"]) {
    await writeFile(resolve(root, `src/modules/${family}/source-controls.json`),
      JSON.stringify(rows.filter(row => row.family === family), null, 2) + "\n");
  }
  console.log(`Recovered ${rows.length} source variants; preserved archives unchanged.`);
}

async function main() {
  const root = resolve(import.meta.dirname, "..");
  const mode = process.argv[2];
  if (mode === "--recover-controls") return recover(root);
  if (!["--apply", "--check"].includes(mode)) throw new Error("Use --recover-controls, --check or --apply.");
  let changed = 0;
  for (const [family, key, name, sprite] of variants) {
    if (sprite === null) continue;
    const filename = resolve(root, `public/media/${family}/native/${family === "algebra" ? key : name}/timeline.mjs`);
    const source = await readFile(filename, "utf8");
    const patched = patchAlgebraColoringPlaybackControl(source, family, key);
    if (patchAlgebraColoringPlaybackControl(patched, family, key) !== patched) throw new Error("Non-idempotent playback patch.");
    if (source === patched) continue;
    changed++;
    // Hash-addressed backup and candidate preserve all pre-existing optimizations.
    const cache = resolve(root, ".cache/algebra-coloring-playback-originals");
    await mkdir(cache, { recursive: true });
    const backup = resolve(cache, `${sha(source)}.mjs`);
    try { await writeFile(backup, source, { flag: "wx" }); }
    catch (error) {
      if (error.code !== "EEXIST" || sha(await readFile(backup)) !== sha(source)) throw error;
    }
    const candidate = resolve(cache, `${sha(patched)}.candidate.mjs`);
    await writeFile(candidate, patched);
    if (spawnSync(process.execPath, ["--check", candidate], { stdio: "inherit" }).status !== 0) {
      throw new Error("Playback candidate syntax failed.");
    }
    const [before, after] = await Promise.all([import(pathToFileURL(backup)), import(pathToFileURL(candidate))]);
    if (!isDeepStrictEqual(before.metadata, after.metadata)
      || !isDeepStrictEqual(Object.keys(before).sort(), Object.keys(after).sort())) {
      throw new Error("Playback patch changed native exports or frame metadata.");
    }
    if (sha(await readFile(filename)) !== sha(source)) throw new Error("Concurrent native painter edit.");
    if (mode === "--apply") await rename(candidate, filename);
  }
  console.log(`${mode}: 10 reviewed native painters, ${changed} ${mode === "--apply" ? "patched" : "would change"}.`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
