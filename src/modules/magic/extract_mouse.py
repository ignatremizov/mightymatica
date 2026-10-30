"""Mechanical XFL/ActionScript import. Archives are read-only inputs.

Run from the project root with python3 src/modules/magic/extract_mouse.py.
Only generated family data and selected original media are written.
"""
import json
import re
import shutil
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
ARCHIVE = Path("/home/ignat/code/mightymatica-source-recovery/objects/Movies")
NS = {"x": "http://ns.adobe.com/xfl/2008/"}


def children(node, query):
    return node.findall(query, NS)


def matrix(node):
    item = node.find("x:matrix/x:Matrix", NS)
    return [float(item.get(key, default)) if item is not None else float(default)
            for key, default in zip(("a", "b", "c", "d", "tx", "ty"), ("1", "0", "0", "1", "0", "0"))]


def combine(p, q):
    a, b, c, d, x, y = p
    e, f, g, h, u, v = q
    return [a*e+c*f, b*e+d*f, a*g+c*h, b*g+d*h, a*u+c*v+x, b*u+d*v+y]


def point(m, x, y):
    return [round(m[0]*x+m[2]*y+m[4], 3), round(m[1]*x+m[3]*y+m[5], 3)]


def elements(timeline, frame=0):
    result = []
    for layer in children(timeline, "x:layers/x:DOMLayer"):
        if layer.get("layerType") in ("guide", "folder"):
            continue
        for f in children(layer, "x:frames/x:DOMFrame"):
            index = int(f.get("index", "0"))
            if index <= frame < index + int(f.get("duration", "1")):
                container = f.find("x:elements", NS)
                if container is not None:
                    result.extend(container)
    return result


def extract(name):
    directory = ARCHIVE / name
    document = next((directory / "project").rglob("DOMDocument.xml"))
    library = document.parent / "LIBRARY"
    doc = ET.parse(document).getroot()
    cache = {}

    def symbol(item):
        label = item.get("libraryItemName")
        if label not in cache:
            cache[label] = ET.parse(library / (label + ".xml")).getroot()
        return cache[label]

    def walls(item, parent):
        transform = combine(parent, matrix(item))
        tag = item.tag.split("}")[-1]
        if tag == "DOMSymbolInstance":
            timeline = symbol(item).find("x:timeline/x:DOMTimeline", NS)
            return [segment for child in elements(timeline) for segment in walls(child, transform)]
        if tag == "DOMGroup":
            return [segment for child in children(item, "x:members/*") for segment in walls(child, transform)]
        if tag != "DOMShape":
            raise ValueError(f"Unexpected maze element: {tag}")
        result = []
        for edge in children(item, "x:edges/x:Edge"):
            text = edge.get("edges", "")
            # Maze geometry consists of authored straight line strokes, in twips.
            if "[" in text or "#" in text:
                raise ValueError(f"Unexpected non-linear maze edge: {text}")
            cursor = None
            for command, x, y in re.findall(r"([!|/])\s*(-?[\d.]+)\s+(-?[\d.]+)", text):
                p = point(transform, float(x)/20, float(y)/20)
                if command != "!" and cursor is not None:
                    result.append(cursor + p)
                cursor = p
        return result

    timelines = children(doc, "x:timelines/x:DOMTimeline")
    starts, offset = [], 0
    for timeline in timelines:
        duration = max(int(f.get("index", "0")) + int(f.get("duration", "1"))
                       for f in children(timeline, "x:layers/x:DOMLayer/x:frames/x:DOMFrame"))
        starts.append((offset, timeline))
        offset += duration
    source = next((directory / "actionscript/scripts").glob("*fla/MainTimeline.as")).read_text()
    setups = [(int(n), body) for n, body in re.findall(
        r"internal function frame(\d+)\(\) : \*\s*\{(.*?)(?=\n      internal function|\n   \})", source, re.S)
        if "new Tween" in body]
    scenes = []
    for number, body in setups:
        base, timeline = next((base, tl) for base, tl in reversed(starts) if base <= number-1)
        items = {item.get("name"): item for item in elements(timeline, number-1-base) if item.get("name")}
        maze = next(item for key, item in items.items() if key.startswith("maze"))
        cats = []
        for cat, axis, start, end, seconds in re.findall(
            r'new Tween\(this\.(cat\d),"([xy])",Regular.easeInOut,([\d.-]+),([\d.-]+),([\d.]+),true\)', body):
            m = matrix(items[cat])
            cats.append({"x": m[4], "y": m[5], "axis": axis,
                         "start": float(start), "end": float(end), "seconds": float(seconds)})
        targets = []
        prefix = "mk" if name.endswith("oppo") else "cher"
        for target in re.findall(r"addChild\(this\.(" + prefix + r"\d+)\)", body):
            def coordinate(axis):
                match = re.search(r"this\." + target + r"\." + axis + r" = ([^;]+);", body)
                value = match[1]
                if value.startswith("this."):
                    field = value[5:]
                    found = re.search(r"this\." + field + r" = ([\d.]+);", body)
                    if not found:
                        raise ValueError(f"Missing source coordinate {field}")
                    value = found[1]
                return float(value)
            targets.append({"id": target, "x": coordinate("x"), "y": coordinate("y"),
                            "value": int(target[len(prefix)])})
        cheese = matrix(items["cheese"])
        scenes.append({"sourceFrame": number, "scene": timeline.get("name"),
                       "walls": walls(maze, [1, 0, 0, 1, 0, 0]),
                       "cats": cats, "targets": targets, "goal": [cheese[4]+30, cheese[5]+24],
                       "target": 0 if name == "Mouse-cheese" else len(scenes)+3})
    return scenes


result = {name: extract(name) for name in ("Mouse-cheese", "Mouse-cherry", "Mouse-cherry-oppo")}
(ROOT / "src/modules/magic/mouse-data.json").write_text(json.dumps(result, indent=2) + "\n")
media = ROOT / "public/media/magic"
media.mkdir(parents=True, exist_ok=True)
for original, destination in (("47", "cat"), ("66", "mouse"), ("52", "cheese")):
    shutil.copyfile(ARCHIVE / "Mouse-cheese/resources/images" / (original + ".png"), media / (destination + ".png"))
print({key: [(s["scene"], len(s["walls"]), len(s["targets"])) for s in value] for key, value in result.items()})
