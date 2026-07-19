"""Normalize four transparent object-state sprites to one compact canvas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prefix", required=True, help="Path before the 1..4 state number")
    parser.add_argument("--width", type=int, default=512)
    parser.add_argument("--height", type=int, default=384)
    parser.add_argument("--margin", type=int, default=12)
    args = parser.parse_args()

    paths = [Path(f"{args.prefix}{state}.png") for state in range(1, 5)]
    images = [Image.open(path).convert("RGBA") for path in paths]
    union = None
    for image in images:
        alpha = image.getchannel("A")
        bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
        if bbox is None:
            raise ValueError("Sprite has no visible pixels")
        if union is None:
            union = list(bbox)
        else:
            union[0] = min(union[0], bbox[0])
            union[1] = min(union[1], bbox[1])
            union[2] = max(union[2], bbox[2])
            union[3] = max(union[3], bbox[3])

    assert union is not None
    padding = max(8, round(max(union[2] - union[0], union[3] - union[1]) * 0.025))
    crop_box = (
        max(0, union[0] - padding),
        max(0, union[1] - padding),
        min(images[0].width, union[2] + padding),
        min(images[0].height, union[3] + padding),
    )
    available_width = args.width - args.margin * 2
    available_height = args.height - args.margin * 2
    crop_width = crop_box[2] - crop_box[0]
    crop_height = crop_box[3] - crop_box[1]
    scale = min(available_width / crop_width, available_height / crop_height)
    output_size = (round(crop_width * scale), round(crop_height * scale))

    for path, image in zip(paths, images, strict=True):
        cropped = image.crop(crop_box).resize(output_size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (args.width, args.height), (0, 0, 0, 0))
        x = (args.width - output_size[0]) // 2
        y = args.height - args.margin - output_size[1]
        canvas.alpha_composite(cropped, (x, y))
        canvas.save(path, format="PNG", optimize=True)
        print(f"Optimized {path} -> {args.width}x{args.height}")


if __name__ == "__main__":
    main()
