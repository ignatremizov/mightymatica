"""Recover reviewed source controls without executing ActionScript or artwork."""
import hashlib
import json
import math
import re
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
reader = runpy.run_path(str(ROOT / "src/modules/calculus/recover-controls.py"))
ARCHIVE, NS = reader["ARCHIVE"], reader["NS"]
ET, recover = reader["ET"], reader["recover"]

# Source pp classes reviewed against their root Play/Stop and stopped 2/1 states.
REASONING = {
    "paradox": {"en": [75], "ru": [75, 274]},
    "burninghouse": {"en": [], "ru": []},
    "grandma": {"en": [51], "ru": [51]},
    "hunter": {"en": [44], "ru": [44]},
    "snail": {"en": [43], "ru": [43]},
    "staruhi": {"en": [59], "ru": [59]},
    "tram": {"en": [], "ru": []},
    "turtles": {"en": [], "ru": []},
    "wine": {"en": [23], "ru": [23]},
    "bacteria": {"en": [20], "ru": [20]},
    "hand": {"en": [17], "ru": [17]},
}
LOGIC = [
    ("wisemen-en", "Wisemen", 29),
    ("wisemen-ru", "Wisemen-ru", 28),
    ("wisemen-eight-en", "Wisemen 8", 43),
    ("wisemen-eight-ru", "Wisemen 8-ru", 45),
]


def rect(bounds):
    x, y, right, bottom = bounds
    result = dict(x=x, y=y, width=right-x, height=bottom-y)
    if not all(math.isfinite(value) for value in result.values()) or min(result["width"], result["height"]) <= 0:
        raise ValueError("Invalid source control rectangle")
    return result


def controls(name, symbols, expected_hash):
    base = ARCHIVE / name
    raw = (base / "original" / f"{name}.swf").read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected_hash:
        raise ValueError(f"Changed source: {name}")
    document = base / "project" / f"{name}.xfl" / name / "DOMDocument.xml"
    root = ET.parse(document).getroot()
    actual = {instance.get("libraryItemName") for instance in root.findall(".//x:DOMFrame/x:elements/x:DOMSymbolInstance", NS)
              if instance.get("name") == "pp"}
    if actual != {f"Symbol {symbol}" for symbol in symbols}:
        raise ValueError(f"Unreviewed transport symbols: {name}")
    result = dict(source=f"Movies/{name}.swf", sourceSha256=expected_hash,
                  transportSymbols=[f"sprite{symbol}" for symbol in symbols],
                  playbackHotspots=[], stopHotspots={}, sourceClasses=[])
    for symbol in symbols:
        item = ET.parse(document.parent / "LIBRARY" / f"Symbol {symbol}.xml").getroot()
        classname = item.get("linkageClassName")
        script = base / "actionscript/scripts" / Path(*classname.split(".")).with_suffix(".as")
        source = script.read_text()
        for required in ("MovieClip(root).play()", "MovieClip(root).stop()", "gotoAndStop(2)", "gotoAndStop(1)"):
            if required not in source:
                raise ValueError(f"Unreviewed control handler: {name} / {classname}")
        if not re.search(r"addFrameScript\(0,.*?1,", source):
            raise ValueError(f"Unreviewed control states: {name}")
        data = recover(name, f"Symbol {symbol}")
        if len(data["children"]) != 2 or {child["state"] for child in data["children"]} != {"play", "pause"}:
            raise ValueError(f"Unexpected control composition: {name}")
        result["sourceClasses"].append(classname)
        for place in data["placements"]:
            if place["id"] != "pp":
                continue
            bounds = list(place["rects"].values())
            union = [min(b[0] for b in bounds), min(b[1] for b in bounds),
                     max(b[2] for b in bounds), max(b[3] for b in bounds)]
            result["playbackHotspots"].append(dict(firstFrame=place["startFrame"], lastFrame=place["endFrame"], **rect(union)))
    # These are root.play() continuations only, never answer or chapter jumps.
    for place in recover(name, None, ("bPlay", "bHint"))["placements"]:
        if place["id"] not in ("bPlay", "bHint"):
            continue
        for frame in place["resumeFrames"]:
            result["stopHotspots"][str(frame)] = dict(**rect(place["rect"]), sourceArtwork=True)
    result["playbackHotspots"].sort(key=lambda entry: entry["firstFrame"])
    return result


def main():
    timelines = json.loads((ROOT / "src/modules/reasoning/native-timelines.json").read_text())
    reasoning = {}
    for family, languages in REASONING.items():
        for locale, symbols in languages.items():
            entry = timelines[family][locale]
            reasoning[f"{family}:{locale}"] = controls(Path(entry["source"]).stem, symbols, entry["sha256"])
    logic = {}
    for key, name, symbol in LOGIC:
        audio = json.loads((ROOT / f"src/modules/logic/{key}-audio.json").read_text())
        logic[key] = controls(name, [symbol], audio["sourceSha256"])
    for family, data in (("reasoning", reasoning), ("logic", logic)):
        target = ROOT / f"src/modules/{family}/source-controls.json"
        target.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        print(f"{family}: {len(data)} reviewed sources, "
              f"{sum(len(row['playbackHotspots']) for row in data.values())} playback spans, "
              f"{sum(len(row['stopHotspots']) for row in data.values())} simple stops")


if __name__ == "__main__":
    main()
