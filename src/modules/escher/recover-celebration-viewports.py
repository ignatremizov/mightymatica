"""Recover picture-only viewports from preserved rectangular XFL bitmap shapes."""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path("/home/ignat/code/mightymatica-source-recovery/objects/Movies")
OUT = Path(__file__).with_name("celebration-viewports.json")
NS = {"x": "http://ns.adobe.com/xfl/2008/"}
SOURCES = {
    "BandF": (39, "Bitmap 42.png"),
    "faces": (42, "Bitmap 45.png"),
    "hands": (39, "Bitmap 42.png"),
    "lizards": (39, "Bitmap 42.jpg"),
    "stairbig": (39, "Bitmap 42.jpg"),
    "stairs": (41, "Bitmap 43.png"),
    "waterfall": (39, "Bitmap 42.jpg"),
}


def rectangular_edges(edges):
    if re.search(r"[^!| \d-]", edges):
        raise ValueError("Nonrectangular edge grammar")
    values = list(map(int, re.findall(r"-?\d+", edges)))
    points = list(zip(values[::2], values[1::2]))
    if len(points) != 5 or points[0] != points[-1] or len(set(points)) != 4:
        raise ValueError("Expected four closed rectangle corners")
    xs, ys = sorted({p[0] for p in points}), sorted({p[1] for p in points})
    if len(xs) != 2 or len(ys) != 2:
        raise ValueError("Expected axis-aligned rectangle")
    return [xs[0] / 20, ys[0] / 20, xs[1] / 20, ys[1] / 20]


def bitmap_rectangles(element, bitmap=None):
    rectangles = []
    for shape in element.findall(".//x:DOMShape", NS):
        styles = {style.get("index") for style in shape.findall("./x:fills/x:FillStyle", NS)
                  if any(bitmap is None or fill.get("bitmapPath") == bitmap
                         for fill in style.findall("./x:BitmapFill", NS))}
        for edge in shape.findall("./x:edges/x:Edge", NS):
            if styles.intersection([edge.get("fillStyle0"), edge.get("fillStyle1")]):
                rectangles.append(rectangular_edges(edge.get("edges")))
    return rectangles


def union(rectangles):
    if not rectangles:
        raise ValueError("Missing original bitmap rectangle")
    return [min(r[0] for r in rectangles), min(r[1] for r in rectangles),
            max(r[2] for r in rectangles), max(r[3] for r in rectangles)]


result = {}
for key, (symbol_id, final_bitmap) in SOURCES.items():
    folder = ROOT / f"Escher-{key}-game/project/Escher-{key}-game.xfl/Escher-{key}-game"
    document = ET.parse(folder / "DOMDocument.xml").getroot()
    layers = document.findall("./x:timelines/x:DOMTimeline/x:layers/x:DOMLayer", NS)
    symbol = ET.parse(folder / f"LIBRARY/Symbol {symbol_id}.xml").getroot()
    initial_rectangles = bitmap_rectangles(symbol)
    if not initial_rectangles:
        children = symbol.findall(".//x:DOMSymbolInstance", NS)
        if len(children) != 1:
            raise ValueError("Unverified bitmap wrapper")
        child_matrix = children[0].find("./x:matrix/x:Matrix", NS)
        if child_matrix is None or any(float(v) != 0 for v in child_matrix.attrib.values()):
            raise ValueError("Nonidentity bitmap wrapper")
        child = ET.parse(folder / f"LIBRARY/{children[0].get('libraryItemName')}.xml").getroot()
        initial_rectangles = bitmap_rectangles(child)
    local = union(initial_rectangles)
    transition = []
    for index in range(156, 180):
        found = []
        for layer in layers:
            for frame in layer.findall("./x:frames/x:DOMFrame", NS):
                first = int(frame.get("index"))
                if not first <= index < first + int(frame.get("duration", "1")):
                    continue
                for instance in frame.findall("./x:elements/x:DOMSymbolInstance", NS):
                    if instance.get("libraryItemName") == f"Symbol {symbol_id}":
                        matrix = instance.find("./x:matrix/x:Matrix", NS)
                        if float(matrix.get("b", 0)) or float(matrix.get("c", 0)):
                            raise ValueError("Unexpected rotated transition picture")
                        a, d = float(matrix.get("a", 1)), float(matrix.get("d", 1))
                        x, y = float(matrix.get("tx", 0)), float(matrix.get("ty", 0))
                        found.append([x + a * local[0], y + d * local[1],
                                      x + a * local[2], y + d * local[3]])
        if len(found) != 1:
            raise ValueError(f"Missing/ambiguous {key} source frame {index + 1}")
        transition.append(found[0])
    final_rectangles = []
    for layer in layers:
        for frame in layer.findall("./x:frames/x:DOMFrame", NS):
            first = int(frame.get("index"))
            if first <= 180 < first + int(frame.get("duration", "1")):
                final_rectangles.extend(bitmap_rectangles(frame, final_bitmap))
    if key == "hands":
        final_rectangles = bitmap_rectangles(ET.parse(folder / "LIBRARY/Symbol 43.xml").getroot(), final_bitmap)
    result[key] = {"transition": transition, "celebration": union(final_rectangles)}

OUT.write_text(json.dumps(result, indent=2) + "\n")
print(f"Recovered 7 × 24 exact transition viewports and 7 authored celebration bitmap rectangles → {OUT}")
