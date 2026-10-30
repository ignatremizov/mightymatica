"""Recover scene-global gates and success branches without executing source AS."""
import json
import re
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
RECOVERY = Path("/home/ignat/code/mightymatica-source-recovery/objects")
NS = {"x": "http://ns.adobe.com/xfl/2008/"}
boards = json.loads((ROOT / "recovered.json").read_text())
result = {}
for activity, board in boards.items():
    source = RECOVERY / board["source"][:-4]
    document = ET.parse(next((source / "project").rglob("DOMDocument.xml"))).getroot()
    script = next((source / "actionscript").rglob("MainTimeline.as")).read_text()
    scenes = []
    offset = 0
    for timeline in document.findall("x:timelines/x:DOMTimeline", NS):
        length = max(int(frame.get("index")) + int(frame.get("duration", "1"))
                     for frame in timeline.findall("x:layers/x:DOMLayer/x:frames/x:DOMFrame", NS))
        scenes.append((offset, offset + length, timeline))
        offset += length
    methods = {int(match[1]): match[0] for match in
               re.finditer(r"internal function frame(\d+)\(\)[\s\S]*?\n      \}", script)}
    last_gtf = None
    stages = []
    for stage in board["stages"]:
        frame = stage["frame"]
        body = methods[frame]
        assignment = re.search(r"this\.gtf = (\d+);", body)
        if assignment:
            last_gtf = int(assignment[1])
        scene_offset, _, timeline = next(scene for scene in scenes if scene[0] < frame <= scene[1])
        if board["mode"] == "connect" or board["mode"] == "odd":
            assert last_gtf is not None
            success = scene_offset + last_gtf
        elif board["mode"] == "sort":
            # Old AS retained gotoAndPlay(89) from the shorter untranslated
            # timeline. The published success sounds/animation begin at 411,
            # after the actual question stop 409, not back in its introduction.
            success = frame + 2
        else:
            assert "gotoAndPlay(89)" in script
            success = scene_offset + 89
        assert frame < success <= offset, (activity, frame, success)
        buttons = []
        if board["mode"] == "proper":
            local = frame - scene_offset - 1
            project = next((source / "project").rglob("DOMDocument.xml")).parent
            for layer in timeline.findall("x:layers/x:DOMLayer", NS):
                for key in layer.findall("x:frames/x:DOMFrame", NS):
                    if not int(key.get("index")) <= local < int(key.get("index")) + int(key.get("duration", "1")):
                        continue
                    for instance in key.findall("x:elements/x:DOMSymbolInstance", NS):
                        name = instance.get("name", "")
                        if name != "Correct" and not name.startswith("Wrong"):
                            continue
                        symbol = ET.parse(project / "LIBRARY" / (instance.get("libraryItemName") + ".xml")).getroot()
                        for sound in symbol.findall(".//x:DOMFrame[@soundName]", NS):
                            assert sound.get("index") == "2", (activity, frame, name)
                            identifier = int(re.fullmatch(r"sound(\d+)\.(?:mp3|wav)", sound.get("soundName"))[1])
                            buttons.append({
                                "pictureId": name, "soundId": identifier,
                                "inPoint44": int(sound.get("inPoint44", "0")),
                                "outPoint44": int(sound.get("outPoint44")) if sound.get("outPoint44") else None,
                                "loops": 1, "sync": "event",
                                "envelope": [{
                                    "mark44": int(point.get("mark44", "0")),
                                    "left": int(point.get("level0", "32768")),
                                    "right": int(point.get("level1", "32768")),
                                } for point in sound.findall("x:SoundEnvelope/x:SoundEnvelopePoint", NS)],
                            })
        stages.append({"frame": frame, "successFrame": success, "buttonCues": buttons})
    result[activity] = {"stages": stages, "endFrame": offset}
(ROOT / "lesson-stages.json").write_text(json.dumps(result, indent=2) + "\n")
