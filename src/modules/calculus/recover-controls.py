"""Recover reviewed transport/menu placement data; never execute ActionScript."""
import json
import re
import struct
import zlib
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
ARCHIVE = Path("/home/ignat/code/mightymatica-source-recovery/objects/Movies")
NS = {"x": "http://ns.adobe.com/xfl/2008/"}

def text_button_hits(base, name):
    """Read text-only button Hit records from SWF; no scripts are executed."""
    raw = (base / "original" / f"{name}.swf").read_bytes()
    data = zlib.decompress(raw[8:]) if raw[:3] == b"CWS" else raw[8:]

    def bits(blob, offset):
        position = offset * 8
        def read(count, signed=False):
            nonlocal position
            value = 0
            for _ in range(count):
                value = (value << 1) | ((blob[position // 8] >> (7-position % 8)) & 1)
                position += 1
            return value - (1 << count) if signed and count and value & (1 << (count-1)) else value
        return read, lambda: (position+7)//8

    def rect(blob, offset):
        read, end = bits(blob, offset)
        size = read(5)
        x0, x1, y0, y1 = [read(size, True)/20 for _ in range(4)]
        return [x0, y0, x1, y1], end()

    def swf_matrix(blob, offset):
        read, end = bits(blob, offset)
        a, d, b, c = 1, 1, 0, 0
        if read(1):
            size = read(5)
            a, d = read(size, True)/65536, read(size, True)/65536
        if read(1):
            size = read(5)
            b, c = read(size, True)/65536, read(size, True)/65536
        size = read(5)
        tx, ty = read(size, True)/20, read(size, True)/20
        return [a, b, c, d, tx, ty], end()

    _, offset = rect(data, 0)
    offset += 4
    texts, buttons = {}, {}
    while offset < len(data):
        tag = struct.unpack_from("<H", data, offset)[0]
        offset += 2
        code, length = tag >> 6, tag & 63
        if length == 63:
            length = struct.unpack_from("<I", data, offset)[0]
            offset += 4
        blob = data[offset:offset+length]
        offset += length
        if code in (11, 33):
            texts[struct.unpack_from("<H", blob)[0]] = rect(blob, 2)[0]
        elif code == 34:
            buttons[struct.unpack_from("<H", blob)[0]] = blob
    result = {}
    for identity, blob in buttons.items():
        offset, hits = 5, []
        while blob[offset]:
            flags = blob[offset]
            child = struct.unpack_from("<H", blob, offset+1)[0]
            placement, offset = swf_matrix(blob, offset+5)
            read, end = bits(blob, offset)
            has_add, has_mult, size = read(1), read(1), read(4)
            for _ in range(4 * (has_add+has_mult)):
                read(size, True)
            offset = end()
            if flags & 8 and child in texts:
                hits.append(transform(texts[child], placement))
            if flags & 0x10:
                count = blob[offset]
                offset += 1
                unsupported = False
                for _ in range(count):
                    filter_id = blob[offset]
                    offset += 1
                    if filter_id != 0:
                        unsupported = True
                        break
                    offset += 23  # DropShadow payload; filters do not expand Hit bounds.
                if unsupported:
                    break
            if flags & 0x20:
                offset += 1
        if hits:
            result[f"Symbol {identity}"] = [
                min(b[0] for b in hits), min(b[1] for b in hits),
                max(b[2] for b in hits), max(b[3] for b in hits)]
    return result


def matrix(element):
    node = element.find("./x:matrix/x:Matrix", NS)
    return [float(node.get(k, str(default))) if node is not None else default
            for k, default in zip(("a", "b", "c", "d", "tx", "ty"), (1, 0, 0, 1, 0, 0))]


def transform(bounds, m):
    x0, y0, x1, y1 = bounds
    points = [(m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5])
              for x, y in ((x0, y0), (x0, y1), (x1, y0), (x1, y1))]
    return [min(p[0] for p in points), min(p[1] for p in points),
            max(p[0] for p in points), max(p[1] for p in points)]


def recover(name, transport, extra_ids=()):
    """Recover one reviewed transport, plus explicitly requested source buttons."""
    if not all(re.fullmatch(r"[A-Za-z_$][\w$]*", identity) for identity in extra_ids):
        raise ValueError("Invalid reviewed control identity")
    base = ARCHIVE / name
    document = base / "project" / f"{name}.xfl" / name / "DOMDocument.xml"
    library = document.parent / "LIBRARY"
    cache = {}
    text_hits = None

    def symbol(name):
        if name not in cache:
            cache[name] = ET.parse(library / f"{name}.xml").getroot()
        return cache[name]

    def bounds(name, depth=0):
        nonlocal text_hits
        if depth > 12:
            raise ValueError("Unexpected recursive control artwork")
        result = []
        for layer in symbol(name).findall("./x:timeline/x:DOMTimeline/x:layers/x:DOMLayer", NS):
            frames = layer.findall("./x:frames/x:DOMFrame", NS)
            # A button's hit state is its fourth frame, retaining previous keys.
            eligible = [f for f in frames if int(f.get("index", "0")) <= 3]
            if not eligible:
                continue
            frame = max(eligible, key=lambda f: int(f.get("index", "0")))
            for element in frame.findall("./x:elements/*", NS):
                if element.tag.endswith("DOMSymbolInstance"):
                    result.append(transform(bounds(element.get("libraryItemName"), depth+1), matrix(element)))
                elif element.tag.endswith("DOMShape"):
                    for edge in element.findall(".//x:Edge", NS):
                        raw = edge.get("edges", "")
                        if "#" in raw:
                            raise ValueError("Unreviewed hexadecimal edge coordinate")
                        values = [float(v)/20 for v in re.findall(r"-?\d+(?:\.\d+)?", raw)]
                        if values:
                            result.append(transform([min(values[::2]), min(values[1::2]),
                                                     max(values[::2]), max(values[1::2])], matrix(element)))
        if not result:
            if text_hits is None:
                text_hits = text_button_hits(base, base.name)
            if name in text_hits:
                return text_hits[name]
            raise ValueError(f"No hit artwork: {name}")
        return [min(b[0] for b in result), min(b[1] for b in result),
                max(b[2] for b in result), max(b[3] for b in result)]

    children = []
    for frame in symbol(transport).findall(".//x:DOMFrame", NS) if transport else []:
        for instance in frame.findall("./x:elements/x:DOMSymbolInstance", NS):
            child = instance.get("libraryItemName")
            local = bounds(child)
            children.append({"state": "play" if frame.get("index") == "0" else "pause",
                             "symbol": child, "matrix": matrix(instance), "bounds": local,
                             "transportBounds": transform(local, matrix(instance))})
    root = ET.parse(document).getroot()
    placements = []
    offset = 0
    script = next((base / "actionscript/scripts").glob("*/MainTimeline.as")).read_text()
    functions = dict(re.findall(r"function\s+(\w+)\([^)]*\)\s*:\s*[\w*]+\s*\{([\s\S]*?)\n      \}", script))
    for scene in root.findall("./x:timelines/x:DOMTimeline", NS):
        frames = scene.findall(".//x:DOMFrame", NS)
        length = max(int(f.get("index", "0"))+int(f.get("duration", "1")) for f in frames)
        for frame in frames:
            for instance in frame.findall("./x:elements/x:DOMSymbolInstance", NS):
                identity = instance.get("name", "")
                if identity == "pp" and instance.get("libraryItemName") != transport:
                    continue
                if identity != "pp" and identity not in extra_ids and not re.fullmatch(r"bPart[1-5]|bQuiz|bNext|bQuiz[1-4]|bWrongAns", identity):
                    continue
                start = offset+int(frame.get("index", "0"))+1
                end = start+int(frame.get("duration", "1"))-1
                item = {"id": identity, "scene": scene.get("name"), "startFrame": start,
                        "endFrame": end, "symbol": instance.get("libraryItemName"), "matrix": matrix(instance)}
                if identity == "pp":
                    item["rects"] = {c["state"]: transform(c["transportBounds"], item["matrix"]) for c in children}
                else:
                    item["rect"] = transform(bounds(item["symbol"]), item["matrix"])
                    if identity == "bNext" or identity in extra_ids:
                        resumes = []
                        for function, body in functions.items():
                            match = re.fullmatch(r"frame(\d+)", function)
                            if not match or not start <= int(match[1]) <= end:
                                continue
                            handler = re.search(rf"(?:this\.)?{re.escape(identity)}\.addEventListener\(MouseEvent.CLICK,\s*(?:this\.)?(\w+)\)", body)
                            if (handler and re.search(r"\bstop\(\)", body)
                                    and re.fullmatch(r"\s*MovieClip\(root\)\.play\(\);\s*", functions.get(handler[1], ""))):
                                resumes.append(int(match[1]))
                        item["resumeFrames"] = sorted(resumes)
                    body = functions.get(f"frame{start}", "")
                    handler = re.search(rf"{identity}\.addEventListener\(MouseEvent.CLICK,\s*(?:this\.)?(\w+)\)", body)
                    target = re.search(r'gotoAndPlay\((\d+),\s*"([^"]+)"\)', functions.get(handler[1], "")) if handler else None
                    if target:
                        item["target"] = {"scene": target[2], "frame": int(target[1])}
                placements.append(item)
        offset += length
    return {"source": f"Movies/{name}", "transport": transport, "children": children, "placements": placements}


if __name__ == "__main__":
    data = {"coordinateSpace": "source stage pixels; inclusive one-based root frame ranges",
            "boundsPolicy": "Hit-state vector edge/control-point envelope (excludes stroke); text-only buttons use original SWF Hit-record DefineText RECT and matrix",
            "en": recover("Calculus5min", "Symbol 190"),
            "ru": recover("Calculus5min-ru-mod", "Symbol 117")}
    (ROOT / "source-controls.json").write_text(json.dumps(data, separators=(",", ":")) + "\n")
