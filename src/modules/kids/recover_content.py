"""Offline, read-only recovery of kids question frames and verified input regions.

Run from the standalone project root. Outputs are generated into this family's
owned module/media paths. FFDec is called through the shared serialized helper.
"""
import ast
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from functools import lru_cache

ROOT = Path(__file__).resolve().parents[3]
RECOVERY = Path("/home/ignat/code/mightymatica-source-recovery/objects/Movies")
NS = {"x": "http://ns.adobe.com/xfl/2008/"}
CATALOG = [
    ("kids-find-connect", "Find and connect", "connect"),
    ("kids-find-improper", "Find improper to", "odd"),
    ("kids-find-couple", "Findcouplewithline", "couple"),
    ("kids-find-match", "Findmatchandconnect", "connect"),
    ("kids-find-proper", "Findproper", "proper"),
    ("kids-find-same", "Findsamecoupleline", "same"),
    ("kids-put-place", "Put in place", "place"),
    ("kids-share-color", "Sharecolor-eng", "sort"),
    ("kids-share-shape", "Shareform-eng", "sort"),
    ("kids-share-size", "Sharesize-eng", "sort"),
]


def number(expression):
    """Only literal numeric arithmetic from recovered coordinate assignments."""
    node = ast.parse(expression, mode="eval").body
    def walk(value):
        if isinstance(value, ast.Constant) and isinstance(value.value, (int, float)):
            return value.value
        if isinstance(value, ast.BinOp) and isinstance(value.op, (ast.Add, ast.Sub)):
            return walk(value.left) + walk(value.right) * (1 if isinstance(value.op, ast.Add) else -1)
        if isinstance(value, ast.UnaryOp) and isinstance(value.op, ast.USub):
            return -walk(value.operand)
        raise ValueError(expression)
    return walk(node)


def matrix(element):
    item = element.find("x:matrix/x:Matrix", NS)
    values = item.attrib if item is not None else {}
    return [float(values.get(key, default)) for key, default in
            [("a", 1), ("b", 0), ("c", 0), ("d", 1), ("tx", 0), ("ty", 0)]]


def transform(bounds, element):
    a, b, c, d, tx, ty = matrix(element)
    points = [(a*x+c*y+tx, b*x+d*y+ty)
              for x in [bounds[0], bounds[2]] for y in [bounds[1], bounds[3]]]
    return [min(p[0] for p in points), min(p[1] for p in points),
            max(p[0] for p in points), max(p[1] for p in points)]


def union(bounds):
    if not bounds:
        return [0, 0, 0, 0]
    return [min(b[0] for b in bounds), min(b[1] for b in bounds),
            max(b[2] for b in bounds), max(b[3] for b in bounds)]


def recover(activity_id, source, mode, export=True):
    folder = RECOVERY / source
    metadata = json.loads((folder / "metadata.json").read_text())
    document_file = next((folder / "project").rglob("DOMDocument.xml"))
    project = document_file.parent
    document = ET.parse(document_file).getroot()
    script = next((folder / "actionscript").rglob("MainTimeline.as")).read_text()
    media = {element.attrib["name"]: [0, 0, int(element.get("frameRight", "0"))/20,
             int(element.get("frameBottom", "0"))/20] for element in document.findall("x:media/x:DOMBitmapItem", NS)}

    @lru_cache(maxsize=None)
    def symbol_bounds(name):
        library = project / "LIBRARY" / (name + ".xml")
        if not library.exists():
            return media.get(name, [0, 0, 0, 0])
        symbol = ET.parse(library).getroot()
        # Bounds across button states also cover buttons whose up state is a
        # different layer from their over/down state.
        return union([element_bounds(element) for element in
                      symbol.findall(".//x:elements/*", NS)])

    def element_bounds(element):
        tag = element.tag.split("}")[-1]
        if tag in ["DOMSymbolInstance", "DOMBitmapInstance"]:
            bounds = symbol_bounds(element.get("libraryItemName"))
        elif tag == "DOMShape":
            points = []
            for edge in element.findall(".//x:Edge", NS):
                # XFL stores shape edges in twips. Bounds include Bézier control
                # points (conservative hit areas, never an answer-key inference).
                values = re.findall(r"(?<![#\w])-?\d+(?:\.\d+)?", edge.get("edges", ""))
                points.extend((float(values[i])/20, float(values[i+1])/20)
                              for i in range(0, len(values)-1, 2))
            bounds = [min((p[0] for p in points), default=0),
                      min((p[1] for p in points), default=0),
                      max((p[0] for p in points), default=0),
                      max((p[1] for p in points), default=0)]
        elif tag == "DOMGroup":
            bounds = union([element_bounds(child) for child in element.findall("x:members/*", NS)])
        else:
            bounds = [0, 0, 0, 0]
        return transform(bounds, element)

    def instances(frame):
        result = []
        offset = 0
        active_timeline = None
        local_frame = frame
        for timeline in document.findall("x:timelines/x:DOMTimeline", NS):
            length = max((int(f.get("index", "0")) + int(f.get("duration", "1"))
                          for f in timeline.findall("x:layers/x:DOMLayer/x:frames/x:DOMFrame", NS)), default=0)
            if offset <= frame-1 < offset+length:
                active_timeline = timeline
                local_frame = frame-offset
                break
            offset += length
        if active_timeline is None:
            return result
        for layer in active_timeline.findall("x:layers/x:DOMLayer", NS):
            for keyframe in layer.findall("x:frames/x:DOMFrame", NS):
                start = int(keyframe.get("index", "0"))
                if start <= local_frame-1 < start + int(keyframe.get("duration", "1")):
                    for element in keyframe.findall("x:elements/*", NS):
                        if element.get("name"):
                            result.append((element.get("name"), element_bounds(element)))
        return result

    values = {}
    stages = []
    methods = list(re.finditer(r"internal function frame(\d+)\(\).*?\n      \}", script, re.S))
    for method in methods:
        frame = int(method[1])
        body = method[0]
        for assignment in re.finditer(r"this\.(\w+)\s*=\s*([0-9+\- .]+);", body):
            values[assignment[1]] = number(assignment[2])
        if "stop();" not in body or not any(key in body for key in [
                "figStartX", "figEndX", "s4StartX", "leaveStartX", "numofcircles", "ballsmlStartX"]):
            continue
        stage = {"frame": frame, "points": [], "pairs": [], "required": 1}
        visible = instances(frame)
        points = stage["points"]

        def point(identifier, x, y, radius=40, label=None):
            if 0 <= x <= metadata["width_px"] and 0 <= y <= metadata["height_px"]:
                points.append({"id": identifier, "x": x, "y": y, "radius": radius,
                               "label": label or identifier})

        def coords(prefix, suffix):
            return values.get(prefix+suffix+"X", -1000), values.get(prefix+suffix+"Y", -1000)

        if mode == "connect":
            point("sample", *coords("fig", "Start"), values.get("offset", 40), "Example figure")
            # Every visible figure remains selectable, not only the accepted
            # destinations; otherwise keyboard controls would reveal the answer.
            for name, bounds in visible:
                if re.fullmatch(r"(fig\d+|[TCS]\d+)", name):
                    point(name, (bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2, 35)
            artist = re.search(r"this\.(artist\w*)\(\);", body)[1]
            function_name = {"artist": "stopDrawing"}.get(artist)
            if source == "Find and connect":
                suffix = artist.removeprefix("artist")
                # Authored artist4 is paired with stopDrawing3.
                function_name = "stopDrawing" + ("3" if suffix == "4" else suffix)
                callback = re.search(r"public function "+function_name+r"\(.*?(?=\n      public function|\n      internal function)", script, re.S)[0]
                accepted = sorted(set(re.findall(r"this\.(fig\d+)EndX", callback)))
            else:
                accepted = ["fig1", "fig2", "fig3"] + ([] if frame % 600 in [87, 203, 380] else ["fig4"])
            for name in accepted:
                x, y = coords(name, "End")
                if x < 0 or x >= metadata["width_px"]:
                    continue
                # Script coordinates are authoritative over approximate library
                # bounds for valid destinations.
                existing_name = name
                if source == "Findmatchandconnect":
                    active = "T" if frame % 600 in [87, 203, 380] else "C" if frame % 600 in [117, 243, 329, 455] else "S"
                    existing_name = active+name.removeprefix("fig")
                points[:] = [p for p in points if p["id"] != existing_name]
                point(existing_name, x, y, values.get("offset", 40))
                stage["pairs"].append(["sample", existing_name])
        elif mode == "couple":
            for name, label in [("leave", "Leaf"), ("flower", "Flower"), ("lemon", "Lemon"), ("tomato", "Tomato")]:
                point(name, *coords(name, "Start"), 45, label)
                partner = {"leave": ("frog", "Frog"), "flower": ("gloves", "Gloves"),
                           "lemon": ("chiken", "Chick"), "tomato": ("strawb", "Strawberry")}[name]
                point(partner[0], *coords(name, "End"), 45, partner[1])
                stage["pairs"].append([name, partner[0]])
            stage["required"] = 4
        elif mode == "same":
            # The decoys are baked together into larger unnamed symbols, not
            # individual named MovieClips. Their shelf positions are verified
            # against all six exported question frames.
            if frame == 87:
                columns = [80, 190, 330, 465]
            elif frame == 277:
                columns = [70, 170, 275, 375, 475]
            else:
                columns = [50, 145, 230, 315, 400, 490]
            for row, y in enumerate([150, 300, 455]):
                for column, x in enumerate(columns):
                    point(f"picture-{row}-{column}", x, y, 37)
            for name in ["s4", "s11"]:
                x, y = coords(name, "Start")
                nearest = min(points, key=lambda p: (p["x"]-x)**2+(p["y"]-y)**2)
                nearest.update(id=name, x=x, y=y)
            stage["pairs"] = [["s4", "s11"]]
        elif mode == "odd":
            point("answer", values["figEndX"], values["figEndY"], values.get("offset", 50))
            # Whole-board input is retained for odd-one-out. Keyboard users move
            # a crosshair rather than receiving an answer-revealing target list.
        elif mode == "proper":
            for name, bounds in visible:
                if name == "Correct" or name.startswith("Wrong"):
                    point(name, (bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2,
                          max(25, min(60, (bounds[2]-bounds[0])/2)))
            stage["pairs"] = [["Correct", "Correct"]]
        elif mode in ["place", "sort"]:
            starts = re.findall(r"this\.(\w+)\.addEventListener\(MouseEvent.MOUSE_DOWN,this.startDragging", body)
            for name in dict.fromkeys(starts):
                x, y = coords(name, "Start")
                # Drag origin is the symbol's registration point. Overlay input
                # centers are adjusted to the symbol's actual visible bounds.
                item = next((bounds for key, bounds in visible if key == name), None)
                if item:
                    x, y = (item[0]+item[2])/2, (item[1]+item[3])/2
                point(name, x, y, 22)
            destinations = [key.removesuffix("EndX") for key in values if key.endswith("EndX")]
            # Only values explicitly assigned in this stage are active targets;
            # unused coordinates persist in Flash variables from earlier rounds.
            destinations = list(dict.fromkeys(re.findall(r"this\.(\w+)EndX\s*=", body)))
            for name in destinations:
                target = "slot-"+name
                x, y = coords(name, "End")
                point(target, x, y, 24)
            for name in starts:
                for destination in destinations:
                    if mode == "sort":
                        valid = coords(name, "End") == coords(destination, "End")
                    else:
                        valid = name[0] == destination[0]
                    if valid:
                        stage["pairs"].append([name, "slot-"+destination])
            if mode == "sort":
                # Sorting bins share coordinates, whereas Put in place slots
                # have independent capacity. Collapse aliases to one input.
                canonical = {}
                for p in points[:]:
                    if p["id"].startswith("slot-"):
                        key = next((k for k in canonical if abs(k[0]-p["x"]) < 5 and abs(k[1]-p["y"]) < 5),
                                   (p["x"], p["y"]))
                        target = canonical.setdefault(key, p["id"])
                        if target != p["id"]:
                            stage["pairs"] = [[a, target if b == p["id"] else b] for a, b in stage["pairs"]]
                            points.remove(p)
                stage["pairs"] = list(map(list, dict.fromkeys(map(tuple, stage["pairs"]))))
            stage["required"] = int(values.get("numofcircles", len(starts))) if mode == "place" else len(starts)
            # Translate registration-point destinations into visible input
            # centers; this changes hit-area presentation, not group membership.
            for p in points:
                if not p["id"].startswith("slot-"):
                    continue
                if mode == "place":
                    p["x"] += 17.45
                    p["y"] += 17.45
                elif source == "Sharecolor-eng":
                    p["x"] += 55 if p["x"] < 200 else 65
                    p["y"] += 65
                    p["radius"] = 45
                else:
                    p["y"] += 45
                    p["radius"] = 45
        if points:
            # Do not put "Correct" first in every keyboard traversal.
            points.sort(key=lambda p: (round(p["y"]/65), p["x"]))
            stages.append(stage)

    output = ROOT / "public/media/kids" / activity_id.removeprefix("kids-")
    if export:
        for start in range(0, len(stages), 120):
            subprocess.run(["node", str(ROOT / "scripts/export-original-frames.mjs"),
                            "--source", str(next((folder / "original").glob("*.swf"))),
                            "--frames", ",".join(str(s["frame"]) for s in stages[start:start+120]),
                            "--output", str(output), "--format", "png"], check=True)
    return {"source": "Movies/"+source+".swf", "mode": mode,
            "width": metadata["width_px"], "height": metadata["height_px"],
            "folder": "kids/"+activity_id.removeprefix("kids-"), "stages": stages}


if __name__ == "__main__":
    import sys
    export = "--data-only" not in sys.argv
    recovered = {activity_id: recover(activity_id, source, mode, export)
                 for activity_id, source, mode in CATALOG}
    destination = ROOT / "src/modules/kids/recovered.json"
    destination.write_text(json.dumps(recovered, ensure_ascii=False, indent=2)+"\n")
    print({key: len(value["stages"]) for key, value in recovered.items()})
