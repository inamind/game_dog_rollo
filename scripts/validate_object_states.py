"""Validate transparent object-state sprites used by the browser game."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("ids", nargs="+")
    parser.add_argument("--directory", default="image_sources")
    parser.add_argument("--width", type=int, default=512)
    parser.add_argument("--height", type=int, default=384)
    args = parser.parse_args()

    failures: list[str] = []
    total_bytes = 0
    for object_id in args.ids:
        for state in range(1, 5):
            path = Path(args.directory) / f"object_{object_id}_state_{state}.png"
            with Image.open(path) as image:
                alpha = image.getchannel("A") if image.mode == "RGBA" else None
                corners = [] if alpha is None else [
                    alpha.getpixel((0, 0)),
                    alpha.getpixel((image.width - 1, 0)),
                    alpha.getpixel((0, image.height - 1)),
                    alpha.getpixel((image.width - 1, image.height - 1)),
                ]
                valid = (
                    image.mode == "RGBA"
                    and image.size == (args.width, args.height)
                    and corners == [0, 0, 0, 0]
                    and alpha is not None
                    and alpha.getextrema() == (0, 255)
                )
                size = path.stat().st_size
                total_bytes += size
                alpha_range = None if alpha is None else alpha.getextrema()
                print(
                    f"{path.name}: {image.mode} {image.size} "
                    f"alpha={alpha_range} corners={corners} {size}B"
                )
                if not valid:
                    failures.append(path.name)

    print(f"TOTAL={total_bytes} bytes BAD={failures}")
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
