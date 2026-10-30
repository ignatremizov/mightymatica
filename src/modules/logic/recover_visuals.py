"""Reproducible, read-only XFL extraction for the logic family's native UI.

Run from the project root. Generated files stay within this family's ownership.
Static keyframes are not claimed to be a full Flash renderer.
"""
from pathlib import Path
import base64
import html
import json
import re
import xml.etree.ElementTree as ET
import ctypes as C

RSVG = C.CDLL("librsvg-2.so.2")
CAIRO = C.CDLL("libcairo.so.2")
GOBJECT = C.CDLL("libgobject-2.0.so.0")
RSVG.rsvg_handle_new_from_data.argtypes = [C.c_char_p, C.c_size_t, C.c_void_p]
RSVG.rsvg_handle_new_from_data.restype = C.c_void_p
RSVG.rsvg_handle_render_cairo.argtypes = [C.c_void_p, C.c_void_p]
RSVG.rsvg_handle_render_cairo.restype = C.c_int
CAIRO.cairo_image_surface_create.argtypes = [C.c_int, C.c_int, C.c_int]
CAIRO.cairo_image_surface_create.restype = C.c_void_p
CAIRO.cairo_create.argtypes = [C.c_void_p]
CAIRO.cairo_create.restype = C.c_void_p
CAIRO.cairo_surface_write_to_png.argtypes = [C.c_void_p, C.c_char_p]
CAIRO.cairo_destroy.argtypes = [C.c_void_p]
CAIRO.cairo_surface_destroy.argtypes = [C.c_void_p]
GOBJECT.g_object_unref.argtypes = [C.c_void_p]

ROOT = Path("/home/ignat/code/mightymatica-source-recovery/objects/Movies")
DEST = Path("public/media/logic")
NS = {"x": "http://ns.adobe.com/xfl/2008/"}
DEST.mkdir(parents=True, exist_ok=True)
# Remove obsolete outputs from this extractor's earlier bitmap-reference pass.
for activity in ["completechain", "necklace", "rippednecklace", "stones", "wisemen", "wisemen-8"]:
    for obsolete in DEST.glob(activity + "-Bitmap-*"):
        obsolete.unlink()
for inspection in ["inspection.png", "necklace-inspection.png", "stones-inspection.png", "ripped-inspection.png"]:
    target = DEST / inspection
    if target.exists():
        target.unlink()


def tag(node):
    return node.tag.rsplit("}", 1)[-1]


def matrix(node):
    m = node.find("x:matrix/x:Matrix", NS)
    if m is None:
        return ""
    return "matrix(%s)" % " ".join(m.get(k, default) for k, default in
                                   [("a", "1"), ("b", "0"), ("c", "0"), ("d", "1"), ("tx", "0"), ("ty", "0")])


class Renderer:
    def __init__(self, name):
        self.name = name
        self.root = ROOT / name
        self.project = self.root / "project" / (name + ".xfl") / name
        self.doc = ET.parse(self.project / "DOMDocument.xml").getroot()
        self.symbols = {}
        self.serial = 0
        self.named = []
        self.skip = set()
        self.skipped = set()
        self.metadata = json.loads((self.root / "metadata.json").read_text())

    def bitmap(self, name):
        path = self.project / "LIBRARY" / name
        mime = "image/jpeg" if path.suffix.lower() in [".jpg", ".jpeg"] else "image/png"
        return "data:%s;base64,%s" % (mime, base64.b64encode(path.read_bytes()).decode())

    def path(self, raw):
        # XFL coordinates are twips; hexadecimal coordinates have eight fractional bits.
        tokens = re.findall(r"[!|\[\]]|#[0-9a-fA-F.]+|-?\d+(?:\.\d+)?", raw)
        out = []
        for token in tokens:
            if token in "!|[]":
                out.append({"!": "M", "|": "L", "[": "Q", "]": "Q"}[token])
            elif token.startswith("#"):
                whole, _, fraction = token[1:].partition(".")
                value = int(whole, 16)
                if value & 0x80000000:
                    value -= 0x100000000
                out.append(str((value + (int(fraction, 16) / 256 if fraction else 0)) / 20))
            else:
                out.append(str(float(token) / 20))
        return " ".join(out)

    def shape(self, node):
        styles = {}
        definitions = []
        for fill in node.findall("x:fills/x:FillStyle", NS):
            content = list(fill)[0] if len(fill) else None
            if content is None:
                continue
            kind = tag(content)
            if kind == "SolidColor":
                styles[fill.get("index")] = content.get("color", "#000000")
            elif kind == "BitmapFill":
                self.serial += 1
                uid = f"bitmap{self.serial}"
                # XFL bitmap matrices use twip-scale linear components, pixel translations.
                m = content.find("x:matrix/x:Matrix", NS)
                a = float(m.get("a", "20")) / 20
                d = float(m.get("d", "20")) / 20
                tx, ty = m.get("tx", "0"), m.get("ty", "0")
                image = self.bitmap(content.get("bitmapPath"))
                # Intrinsic dimensions from the project's bitmap inventory.
                item = next((b for b in self.doc.findall("x:media/x:DOMBitmapItem", NS)
                             if b.get("name") == content.get("bitmapPath")), None)
                w = float(item.get("frameRight", "2000")) / 20 if item is not None else 100
                h = float(item.get("frameBottom", "2000")) / 20 if item is not None else 100
                definitions.append(f'<pattern id="{uid}" width="{w}" height="{h}" patternUnits="userSpaceOnUse" patternTransform="matrix({a} 0 0 {d} {tx} {ty})"><image width="{w}" height="{h}" xlink:href="{image}"/></pattern>')
                styles[fill.get("index")] = f"url(#{uid})"
            else:
                stops = content.findall("x:GradientEntry", NS)
                if stops:
                    self.serial += 1
                    uid = f"gradient{self.serial}"
                    gradient = "radialGradient" if kind == "RadialGradient" else "linearGradient"
                    definitions.append(f'<{gradient} id="{uid}">' + "".join(
                        f'<stop offset="{s.get("ratio", "0")}" stop-color="{s.get("color", "#000000")}" stop-opacity="{s.get("alpha", "1")}"/>' for s in stops) + f"</{gradient}>")
                    styles[fill.get("index")] = f"url(#{uid})"
        strokes = {}
        for stroke in node.findall("x:strokes/x:StrokeStyle", NS):
            solid = stroke.find("x:SolidStroke", NS)
            if solid is not None:
                color = solid.find("x:fill/x:SolidColor", NS)
                strokes[stroke.get("index")] = (color.get("color", "#000000") if color is not None else "#000000", solid.get("weight", "1"))
        paths = []
        fills = {}
        for edge in node.findall("x:edges/x:Edge", NS):
            path = self.path(edge.get("edges", ""))
            for key in ["fillStyle0", "fillStyle1"]:
                index = edge.get(key, "0")
                if index != "0":
                    fills.setdefault(index, []).append(path)
            index = edge.get("strokeStyle", "0")
            if index in strokes:
                color, weight = strokes[index]
                paths.append(f'<path d="{path}" fill="none" stroke="{color}" stroke-width="{weight}" stroke-linecap="round" stroke-linejoin="round"/>')
        return "<defs>" + "".join(definitions) + "</defs>" + "".join(
            f'<path d="{" ".join(parts)}" fill="{styles.get(index, "#000000")}" fill-rule="evenodd"/>' for index, parts in fills.items()) + "".join(paths)

    def element(self, node, frame, depth=0):
        if depth > 30:
            raise ValueError("Cyclic symbol")
        name = node.get("name", "")
        if name and depth == 0:
            self.named.append({"name": name, "matrix": matrix(node), "symbol": node.get("libraryItemName")})
        if name in self.skip:
            return ""
        kind = tag(node)
        rendered = ""
        if kind == "DOMShape":
            rendered = self.shape(node)
        elif kind == "DOMGroup":
            rendered = "".join(self.element(child, frame, depth + 1) for child in node.findall("x:members/*", NS))
        elif kind == "DOMSymbolInstance":
            symbol = node.get("libraryItemName")
            if symbol not in self.symbols:
                self.symbols[symbol] = ET.parse(self.project / "LIBRARY" / (symbol + ".xml")).getroot()
            timeline = self.symbols[symbol].find("x:timeline/x:DOMTimeline", NS)
            first = int(node.get("firstFrame", "0"))
            rendered = self.timeline(timeline, first + frame, depth + 1)
        elif kind == "DOMBitmapInstance":
            rendered = f'<image href="{self.bitmap(node.get("libraryItemName"))}"/>'
        elif kind not in ["DOMStaticText", "DOMDynamicText", "DOMInputText"]:
            self.skipped.add(kind)
        transform = matrix(node)
        color = node.find("x:color/x:Color", NS)
        opacity = color.get("alphaMultiplier", "1") if color is not None else "1"
        return f'<g transform="{transform}" opacity="{opacity}">{rendered}</g>'

    def timeline(self, timeline, frame, depth=0):
        if timeline is None:
            return ""
        layers = timeline.findall("x:layers/x:DOMLayer", NS)
        maximum = max((int(f.get("index", "0")) + int(f.get("duration", "1"))
                       for layer in layers for f in layer.findall("x:frames/x:DOMFrame", NS)), default=1)
        frame %= max(1, maximum)
        result = []
        for layer in reversed(layers):
            for key in layer.findall("x:frames/x:DOMFrame", NS):
                start = int(key.get("index", "0"))
                if start <= frame < start + int(key.get("duration", "1")):
                    result.extend(self.element(child, frame - start, depth) for child in key.findall("x:elements/*", NS))
                    break
        return "".join(result)

    def render(self, frame, filename, skip=()):
        self.named = []
        self.skip = set(skip)
        local_frame = frame - 1
        for timeline in self.doc.findall("x:timelines/x:DOMTimeline", NS):
            length = max((int(f.get("index", "0")) + int(f.get("duration", "1"))
                          for f in timeline.findall("x:layers/x:DOMLayer/x:frames/x:DOMFrame", NS)), default=1)
            if local_frame < length:
                break
            local_frame -= length
        body = self.timeline(timeline, local_frame)
        w, h = self.metadata["width_px"], self.metadata["height_px"]
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h}"><rect width="{w}" height="{h}" fill="{self.doc.get("backgroundColor", "#ffffff")}"/>{body}</svg>'
        (DEST / filename).write_text(svg)
        surface = CAIRO.cairo_image_surface_create(0, int(w), int(h))
        encoded = svg.encode()
        handle = RSVG.rsvg_handle_new_from_data(encoded, len(encoded), None)
        context = CAIRO.cairo_create(surface)
        if not RSVG.rsvg_handle_render_cairo(handle, context):
            raise ValueError("SVG render failed")
        if CAIRO.cairo_surface_write_to_png(surface, str(DEST / filename.replace(".svg", ".png")).encode()):
            raise ValueError("PNG export failed")
        CAIRO.cairo_destroy(context)
        CAIRO.cairo_surface_destroy(surface)
        GOBJECT.g_object_unref(handle)
        (DEST / filename).unlink()
        return list(self.named)


def frame_scripts(name):
    candidates = list((ROOT / name / "actionscript").rglob("MainTimeline.as"))
    text = candidates[0].read_text()
    return dict((int(num), body) for num, body in re.findall(
        r"internal function frame(\d+)\(\) : \*\s*\{(.*?)(?=\n      internal function|\n   \})", text, re.S))


def positions(body, suffix):
    values = {}
    for name, axis, value in re.findall(r"this\.(\w+)" + suffix + r"([XY]) = (-?\d+);", body):
        values.setdefault(name, {})[axis.lower()] = int(value)
    return [{"name": name, **point} for name, point in values.items()]


data = {}
for name in ["Completechain", "Necklace", "Rippednecklace", "Stones"]:
    renderer = Renderer(name)
    scripts = frame_scripts(name)
    frames = {"Completechain": [87, 199, 311, 423, 535, 647],
              "Necklace": [85, 144, 215, 301, 392, 470, 541, 627],
              "Rippednecklace": [87, 198, 309],
              "Stones": [n for n, body in scripts.items() if "this.startnext" in body and "this.bSt" in body]}[name]
    stages = []
    previous_starts = []
    for index, frame in enumerate(frames):
        body = scripts[frame]
        starts = positions(body, "Start") or previous_starts
        previous_starts = starts
        filename = f"{name.lower()}-{index + 1}.svg"
        named = renderer.render(frame, filename)
        stage = {"frame": frame, "image": f'logic/{filename.replace(".svg", ".png")}', "starts": starts,
                 "ends": positions(body, "End"), "named": named}
        if name == "Completechain":
            m = re.search(r"this.numbballs = (\d+)", body)
            stage["required"] = int(m[1]) if m else (8 if index < 3 else 6)
        if name == "Stones":
            answer_name = "bSt" + re.search(r"this.bSt(\d+)\.addEventListener\(MouseEvent.CLICK,this.startnext\)", body)[1]
            choices = []
            for button in named:
                if button["name"].startswith("bSt"):
                    xml = ET.parse(renderer.project / "LIBRARY" / (button["symbol"] + ".xml")).getroot()
                    labels = [c.text for c in xml.findall(".//x:characters", NS) if (c.text or "").isdigit()]
                    if labels:
                        choices.append({"name": button["name"], "value": int(labels[0])})
            stage["choices"] = choices
            stage["answer"] = next(c["value"] for c in choices if c["name"] == answer_name)
            stage["level"] = 1 if frame < 1450 else 2 if frame < 3062 else 3
        stages.append(stage)
    data[name] = stages
    print(name, "stages", len(stages), "unsupported", sorted(renderer.skipped))

for name in ["Wisemen", "Wisemen 8"]:
    renderer = Renderer(name)
    data[name] = []
    for index, frame in enumerate([11, 260, 500, 760, 1000, 1097, 1137 if name.endswith("8") else 1140]):
        filename = f'{name.lower().replace(" ", "-")}-{index}.svg'
        renderer.render(frame, filename)
        data[name].append(f'logic/{filename.replace(".svg", ".png")}')
    print(name, "unsupported", sorted(renderer.skipped))

Path("src/modules/logic/recovered.json").write_text(json.dumps(data, ensure_ascii=False, indent=2))
