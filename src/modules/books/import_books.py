"""Recover ordered page photos from the Ncesoft container, not the SWF tag tree.

Run from project root. Archives are opened read-only. See docs/modules/books.md.
"""
import hashlib
import json
import struct
import argparse
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

ARCHIVE = Path("/home/ignat/code/mightymatica-source-recovery/objects/Movies")
TITLES = ["MM-SAT-101-f", "MMCircles", "MMGrade-1-3",
          "Mathbook-SATsubstit", "Mightymatica-1-1", "Mightymatica-1-2",
          "Mightymatica-2-1"]


def recover(java=None, ffdec=None):
    catalog = []
    for title in TITLES:
        data = (ARCHIVE / title / "original" / f"{title}.swf").read_bytes()
        marker = data.index(b"#1@2#3$4%5")
        cursor = marker + 10
        runtime_size = struct.unpack_from(">I", data, cursor)[0]
        cursor += 4 + runtime_size
        xml_size = struct.unpack_from(">I", data, cursor)[0]
        cursor += 4
        project = ET.fromstring(data[cursor:cursor + xml_size])
        resource_start = cursor + xml_size
        out = Path("public/media/books") / title
        out.mkdir(parents=True, exist_ok=True)
        pages = []
        for index, page in enumerate(project.findall("./BookPages/TBookPage")):
            photo = page.find("Photo")
            stream = photo.find("StreamInfo") if photo is not None else None
            record = {"label": photo.get("Caption", "") if photo is not None else "",
                      "originalFile": photo.get("SrcFileName", "").split("\\")[-1] if photo is not None else "",
                      "image": None, "sha256": None,
                      "texts": ["".join(t.itertext()) for t in page.findall("./Texts/*")]}
            if stream is not None and int(stream.get("Size", "0")) > 0:
                offset, size = int(stream.get("Position")), int(stream.get("Size"))
                start = resource_start + offset
                if start < resource_start or start + size > len(data):
                    raise ValueError(f"{title} page {index + 1}: invalid stream")
                image = data[start:start + size]
                ext = "jpg" if image.startswith(b"\xff\xd8\xff") else "png" if image.startswith(b"\x89PNG") else None
                if ext:
                    name = f"page-{index + 1:03}.{ext}"
                    (out / name).write_bytes(image)
                    record.update(image=f"books/{title}/{name}", sha256=hashlib.sha256(image).hexdigest())
                elif image[:3] in (b"CWS", b"FWS", b"ZWS"):
                    nested = Path(".cache/book-recovery") / title
                    nested.mkdir(parents=True, exist_ok=True)
                    (nested.parent / ".gitignore").write_text("*\n")
                    nested_file = nested / record["originalFile"]
                    nested_file.write_bytes(image)
                    # These four documents each contain one full-page JPEG3
                    # bitmap (character 3), one ShowFrame, and no script tags.
                    # Export that bitmap at original resolution, not a
                    # low-resolution stage screenshot or a Flash runtime.
                    converted = out / f"page-{index + 1:03}" / "3.png"
                    if java and ffdec:
                        subprocess.run([java, "-Djava.awt.headless=true", "-jar", ffdec,
                                        "-export", "image",
                                        str(converted.parent), str(nested_file)], check=True)
                    if converted.exists():
                        converted_image = converted.read_bytes()
                        record.update(image=converted.relative_to("public/media").as_posix(),
                                      sha256=hashlib.sha256(converted_image).hexdigest())
            pages.append(record)
        item = {"source": f"Movies/{title}.swf", "key": title, "pages": pages,
                "swfSha256": hashlib.sha256(data).hexdigest()}
        catalog.append(item)
        print(title, "pages", len(pages), "images", sum(p["image"] is not None for p in pages),
              "text overlays", sum(bool(p["texts"]) for p in pages))
    Path("src/modules/books/content.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--java", help="Java executable for optional nested-page conversion")
    parser.add_argument("--ffdec", help="FFDec jar for optional nested-page conversion")
    args = parser.parse_args()
    if bool(args.java) != bool(args.ffdec):
        parser.error("--java and --ffdec must be specified together")
    recover(args.java, args.ffdec)
