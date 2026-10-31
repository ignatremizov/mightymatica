"""Recover only reviewed Motion/Fractals transport and simple Hint hit areas."""
import hashlib
import json
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[3]
READER = runpy.run_path(str(ROOT / "src/modules/calculus/recover-controls.py"))
recover = READER["recover"]
ARCHIVE = READER["ARCHIVE"]
PLANS = {
    "motion": {
        "coin-cluster": {"en": None, "ru": None},
        "caterpillar": {"en": "Symbol 43", "ru": "Symbol 43"},
        "cyclists": {"en": "Symbol 63", "ru": "Symbol 63", "zh": "Symbol 63"},
    },
    "fractals": {"buffon": {"en": "Symbol 44", "ru": "Symbol 41"}},
}


def rectangle(bounds):
    x0, y0, x1, y1 = bounds
    if x1 <= x0 or y1 <= y0:
        raise ValueError("Empty source control Hit bounds")
    return {"x": x0, "y": y0, "width": x1-x0, "height": y1-y0}


def recover_family(family):
    lessons = json.loads((ROOT / f"src/modules/{family}/native-lessons.json").read_text())
    result = {}
    for title, variants in PLANS[family].items():
        result[title] = {}
        for locale, transport in variants.items():
            entry = lessons[title][locale]
            name = entry["source"][7:-4]
            digest = hashlib.sha256((ARCHIVE / name / "original" / f"{name}.swf").read_bytes()).hexdigest()
            if digest != entry["sourceSha256"]:
                raise ValueError("Source/lesson hash mismatch")
            evidence = recover(name, transport, ("bHint",))
            # Answer buttons retain their existing source actions and gates.
            evidence["placements"] = [p for p in evidence["placements"] if p["id"] in ("pp", "bHint")]
            playback, stops = [], {}
            manual = {s["frame"] for s in entry["lesson"]["stops"] if s["kind"] == "manual"}
            for placement in evidence["placements"]:
                if placement["id"] == "pp":
                    play, pause = placement["rects"]["play"], placement["rects"]["pause"]
                    bounds = [min(play[0], pause[0]), min(play[1], pause[1]),
                              max(play[2], pause[2]), max(play[3], pause[3])]
                    playback.append({"firstFrame": placement["startFrame"],
                                     "lastFrame": placement["endFrame"], **rectangle(bounds)})
                else:
                    for frame in placement["resumeFrames"]:
                        if frame not in manual:
                            raise ValueError("Hint is not an existing manual lesson stop")
                        stops[frame] = {**rectangle(placement["rect"]), "sourceArtwork": True}
            result[title][locale] = {
                "source": entry["source"], "sourceSha256": digest,
                "evidence": evidence, "playbackHotspots": playback, "stopHotspots": stops,
            }
    return result


if __name__ == "__main__":
    for family in PLANS:
        output = ROOT / f"src/modules/{family}/source-controls.json"
        output.write_text(json.dumps(recover_family(family), indent=2) + "\n")
