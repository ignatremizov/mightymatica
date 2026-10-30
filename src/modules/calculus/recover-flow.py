"""Recover finite source quiz transitions; never execute ActionScript."""
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
ARCHIVE = Path("/home/ignat/code/mightymatica-source-recovery/objects/Movies")
NS = {"x": "http://ns.adobe.com/xfl/2008/"}


def recover(name):
    source = ARCHIVE / name
    document = source / "project" / f"{name}.xfl" / name / "DOMDocument.xml"
    root = ET.parse(document).getroot()
    script = next((source / "actionscript/scripts").glob("*/MainTimeline.as")).read_text()
    functions = dict(re.findall(r"function\s+(\w+)\([^)]*\)\s*:\s*[\w*]+\s*\{([\s\S]*?)\n      \}", script))
    scenes = []
    offset = 0
    for timeline in root.findall("./x:timelines/x:DOMTimeline", NS):
        frames = timeline.findall(".//x:DOMFrame", NS)
        length = max(int(f.get("index", "0")) + int(f.get("duration", "1")) for f in frames)
        scenes.append({"name": timeline.get("name"), "startFrame": offset + 1, "endFrame": offset + length, "node": timeline})
        offset += length

    def button_sound(symbol):
        library = document.parent / "LIBRARY" / f"{symbol}.xml"
        item = ET.parse(library).getroot()
        for keyframe in item.findall(".//x:DOMFrame", NS):
            name = keyframe.get("soundName", "")
            match = re.fullmatch(r"sound(\d+)\.(?:wav|mp3)", name)
            if keyframe.get("index") == "2" and match:
                return {
                    "soundId": int(match[1]),
                    "inPoint44": int(keyframe.get("inPoint44", "0")),
                    "outPoint44": int(keyframe.get("outPoint44")) if keyframe.get("outPoint44") else None,
                }
        return None

    def target(handler, frame, scene):
        body = functions[handler]
        match = re.search(r"gotoAndPlay\((\d+)(?:,\s*\"([^\"]+)\")?\)", body)
        if match:
            owner = next((s for s in scenes if s["name"] == match[2]), scene) if match[2] else scene
            return owner["startFrame"] + int(match[1]) - 1
        if re.search(r"\.play\(\)", body):
            return frame + 1
        raise ValueError(f"Unknown handler {handler}")

    stops = []
    for function, body in functions.items():
        if not re.fullmatch(r"frame\d+", function) or not re.search(r"\bstop\(\)", body):
            continue
        frame = int(function[5:])
        scene = next(s for s in scenes if s["startFrame"] <= frame <= s["endFrame"])
        listeners = re.findall(r"(bQuiz[1-4]|bWrongAns)\.addEventListener\(MouseEvent.CLICK,\s*(?:this\.)?(\w+)\)", body)
        local = frame - scene["startFrame"]
        positions = {}
        for layer in scene["node"].findall("./x:layers/x:DOMLayer", NS):
            for keyframe in layer.findall("./x:frames/x:DOMFrame", NS):
                start = int(keyframe.get("index", "0"))
                if not start <= local < start + int(keyframe.get("duration", "1")):
                    continue
                for instance in keyframe.findall("./x:elements/x:DOMSymbolInstance", NS):
                    instance_name = instance.get("name")
                    if instance_name not in {name for name, _ in listeners}:
                        continue
                    matrix = instance.find("./x:matrix/x:Matrix", NS)
                    positions[instance_name] = {
                        "x": float(matrix.get("tx", "0")),
                        "y": float(matrix.get("ty", "0")),
                        "symbol": instance.get("libraryItemName"),
                        "buttonSound": button_sound(instance.get("libraryItemName")),
                    }
        actions = [
            {"id": button, "targetFrame": target(handler, frame, scene), **positions.get(button, {})}
            for button, handler in listeners
        ]
        stops.append({
            "frame": frame,
            "kind": "question" if any(a["id"].startswith("bQuiz") for a in actions) else "retry" if actions else "manual",
            "actions": actions,
        })
    return {
        "source": f"Movies/{name}.swf",
        "scenes": [{key: value for key, value in s.items() if key != "node"} for s in scenes],
        "stops": sorted(stops, key=lambda s: s["frame"]),
    }


for language, source_name in [("en", "Calculus5min"), ("ru", "Calculus5min-ru-mod")]:
    (ROOT / f"{language}-flow.json").write_text(json.dumps(recover(source_name), indent=2) + "\n")
