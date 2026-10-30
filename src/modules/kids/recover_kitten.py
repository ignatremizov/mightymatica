"""Generate the complete 555-frame original Kitten animation, locally.

Only generated frames under public/media/kids/kitten are removed after successful
encoding; archives remain read-only. Audio event timing is from DOMDocument.xml.
"""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[3]
SOURCE = Path("/home/ignat/code/mightymatica-source-recovery/objects/Movies/Kitten")
OUTPUT = ROOT / "public/media/kids/kitten"
OUTPUT.mkdir(parents=True, exist_ok=True)

for start in range(1, 556, 120):
    end = min(start+119, 555)
    subprocess.run(["node", str(ROOT / "scripts/export-original-frames.mjs"),
                    "--source", str(SOURCE / "original/Kitten.swf"),
                    "--frames", f"{start}-{end}", "--output", str(OUTPUT),
                    "--format", "png"], check=True)

# Preserve original 24fps motion, with the three root timeline audio events:
# sound48 at frame index4; sound55 at77 (outPoint44=98819); sound56 at138.
# The source's sound48 envelope is a low-volume bed. No playback autostarts.
subprocess.run([
    "nice", "-n", "15", "ffmpeg", "-hide_banner", "-loglevel", "warning", "-y",
    "-framerate", "24", "-start_number", "1", "-i", str(OUTPUT / "%d.png"),
    "-i", str(SOURCE / "resources/sounds/48.mp3"),
    "-i", str(SOURCE / "resources/sounds/55.mp3"),
    "-i", str(SOURCE / "resources/sounds/56.mp3"),
    "-filter_complex",
    "[1:a]volume=0.3,adelay=167:all=1[a1];"
    "[2:a]atrim=end=2.24079365,adelay=3208:all=1[a2];"
    "[3:a]adelay=5750:all=1[a3];"
    "[a1][a2][a3]amix=inputs=3:normalize=0:duration=longest[a]",
    "-map", "0:v", "-map", "[a]", "-t", "23.125",
    "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p",
    "-threads", "2", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
    str(OUTPUT / "kitten.mp4")
], check=True)

# The first frame doubles as poster and an explicit reduced-motion still.
for frame in range(2, 556):
    (OUTPUT / f"{frame}.png").unlink()
