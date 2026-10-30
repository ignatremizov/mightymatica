"""Recover bounded source continuation/drag artwork metadata; never run Flash."""
import json
import re
import runpy
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
SHARED = runpy.run_path(str(ROOT.parent / "calculus" / "recover-controls.py"))
ARCHIVE, NS = SHARED["ARCHIVE"], SHARED["NS"]
matrix, transform = SHARED["matrix"], SHARED["transform"]


def rect(box):
    return dict(x=round(box[0], 5), y=round(box[1], 5),
                width=round(box[2]-box[0], 5), height=round(box[3]-box[1], 5))


def recover(definition):
    name = definition["source"].removeprefix("Movies/").removesuffix(".swf")
    base = ARCHIVE / name
    document = base / "project" / f"{name}.xfl" / name / "DOMDocument.xml"
    library = document.parent / "LIBRARY"
    root = ET.parse(document).getroot()
    script = next((base / "actionscript/scripts").glob("*/MainTimeline.as")).read_text()
    functions = dict(re.findall(r"function\s+(\w+)\([^)]*\)\s*:\s*[\w*]+\s*\{([\s\S]*?)\n      \}", script))
    text_hits = SHARED["text_button_hits"](base, name)
    cache = {}

    def bounds(symbol, depth=0):
        if depth > 12:
            raise ValueError("Unexpected recursive source artwork")
        if symbol in cache:
            return cache[symbol]
        item = ET.parse(library / f"{symbol}.xml").getroot()
        boxes = []
        for layer in item.findall("x:timeline/x:DOMTimeline/x:layers/x:DOMLayer", NS):
            frames = layer.findall("x:frames/x:DOMFrame", NS)
            target = 3 if item.get("symbolType") == "button" else 0
            active = [f for f in frames if int(f.get("index", "0")) <= target]
            if not active:
                continue
            for element in max(active, key=lambda f: int(f.get("index", "0"))).findall("x:elements/*", NS):
                if element.tag.endswith("DOMSymbolInstance"):
                    boxes.append(transform(bounds(element.get("libraryItemName"), depth+1), matrix(element)))
                elif element.tag.endswith("DOMShape"):
                    for edge in element.findall(".//x:Edge", NS):
                        raw = edge.get("edges", "")
                        if "#" in raw:
                            raise ValueError("Unreviewed edge encoding")
                        values = [float(v)/20 for v in re.findall(r"-?\d+(?:\.\d+)?", raw)]
                        if values:
                            boxes.append(transform([min(values[::2]), min(values[1::2]),
                                                    max(values[::2]), max(values[1::2])], matrix(element)))
                elif element.tag.endswith("DOMStaticText") and symbol not in text_hits:
                    left = float(element.get("left", "0"))
                    boxes.append(transform([left, 0, left+float(element.get("width"))/20,
                                            float(element.get("height"))/20], matrix(element)))
        if symbol in text_hits:
            boxes.append(text_hits[symbol])
        if not boxes:
            raise ValueError(f"Missing source bounds: {name}/{symbol}")
        result = [min(b[0] for b in boxes), min(b[1] for b in boxes),
                  max(b[2] for b in boxes), max(b[3] for b in boxes)]
        cache[symbol] = result
        return result

    continuation, vertices = [], {}
    offset = 0
    for scene in root.findall("x:timelines/x:DOMTimeline", NS):
        frames = scene.findall("x:layers/x:DOMLayer/x:frames/x:DOMFrame", NS)
        length = max(int(f.get("index", "0"))+int(f.get("duration", "1")) for f in frames)
        for frame in frames:
            start = offset+int(frame.get("index", "0"))+1
            end = start+int(frame.get("duration", "1"))-1
            for instance in frame.findall("x:elements/x:DOMSymbolInstance", NS):
                identity = instance.get("name", "")
                if re.fullmatch(r"bNext\d*|bProof\d*", identity):
                    resume = []
                    for function, body in functions.items():
                        key = re.fullmatch(r"frame(\d+)", function)
                        if not key or not start <= int(key[1]) <= end:
                            continue
                        handler = re.search(rf"\b{identity}\.addEventListener\(MouseEvent.CLICK,\s*(?:this\.)?(\w+)\)", body)
                        behavior = functions.get(handler[1], "") if handler else ""
                        # Direct root play or the reviewed interlude's local
                        # Next handler; the native player already owns that hold.
                        if handler and (re.fullmatch(r"\s*MovieClip\(root\)\.play\(\);\s*", behavior)
                                        or (int(key[1]) in (definition.get("interactionFrame"), definition.get("interactionFrame", -2)+1)
                                            and re.fullmatch(r"\s*gotoAndPlay\(\d+\);\s*", behavior))):
                            resume.append(int(key[1]))
                    if resume:
                        interaction = definition.get("interactionFrame")
                        if interaction and start <= interaction <= end and interaction+1 in resume:
                            resume.append(interaction)
                        continuation.append(dict(id=identity, firstFrame=start, lastFrame=end,
                                                 resumeFrames=sorted(set(resume)),
                                                 rect=rect(transform(bounds(instance.get("libraryItemName")), matrix(instance)))))
                if identity in ("mc", "mc2", "mc3") and start <= definition.get("interactionFrame", -1) <= end:
                    m = matrix(instance)
                    item = ET.parse(library / f'{instance.get("libraryItemName")}.xml').getroot()
                    texts = item.findall(".//x:DOMStaticText", NS)
                    label = next(("".join(t.itertext()).strip() for t in item.findall(".//x:characters", NS)
                                  if "".join(t.itertext()).strip() in ("A", "B", "C")), {"mc": "A", "mc2": "B", "mc3": "C"}[identity])
                    color = item.find(".//x:DOMShape/x:fills/x:FillStyle/x:SolidColor", NS)
                    vertices[identity] = dict(label=label, x=round(m[4]+8, 5), y=round(m[5]+8, 5),
                                              color=color.get("color") if color is not None else "#0000ff",
                                              sourceFootprint=rect(transform(bounds(instance.get("libraryItemName")), m)))
                    if texts:
                        text = texts[0]
                        left = float(text.get("left", "0"))
                        text_box = transform(transform([left, 0, left+float(text.get("width"))/20,
                                                        float(text.get("height"))/20], matrix(text)), m)
                        font = text.find(".//x:DOMTextAttrs", NS)
                        vertices[identity]["labelOffset"] = dict(
                            x=round(text_box[0]-m[4]-8, 5), y=round(text_box[3]-m[5]-8, 5),
                            size=round(float(font.get("size"))*abs(m[0]), 5))
        offset += length
    if definition.get("interactionFrame") and len(vertices) != 3:
        raise ValueError(f"Missing source drag targets: {name}")
    return dict(source=definition["source"], continuation=continuation,
                vertices=[vertices[key] for key in ("mc", "mc2", "mc3") if key in vertices])


if __name__ == "__main__":
    result = {}
    for metadata in sorted(ROOT.glob("native-*.json")):
        key = metadata.stem.removeprefix("native-").rsplit("-", 1)
        result[":".join(key)] = recover(json.loads(metadata.read_text()))
    (ROOT / "source-interactions.json").write_text(json.dumps(result, indent=2)+"\n")
    print(f"Recovered {len(result)} source variants; source archives unchanged.")
