from pathlib import Path
import sys

from PIL import Image, ImageDraw


SCALE = 8
REGION = (395, 64, 407, 82)


def main():
    if len(sys.argv) != 3:
        raise SystemExit('usage: fix_logo_eye.py INPUT OUTPUT')
    source_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    source = Image.open(source_path).convert('RGBA')

    width = (REGION[2] - REGION[0]) * SCALE
    height = (REGION[3] - REGION[1]) * SCALE
    patch = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(patch)

    # 화면 오른쪽 눈의 오른쪽에 중복된 검은 조각만 흰자 색으로 덮는다.
    # 왼쪽의 기존 눈동자와 눈 외곽선은 원본 픽셀을 그대로 유지한다.
    points = [(4, 4), (9, 5), (10, 11), (8, 15), (4, 13), (3, 8)]
    draw.polygon(
        [(x * SCALE, y * SCALE) for x, y in points],
        fill=(240, 237, 228, 255),
    )
    highlight = [(4, 5), (7, 6), (8, 10), (6, 12), (4, 11)]
    draw.polygon(
        [(x * SCALE, y * SCALE) for x, y in highlight],
        fill=(250, 248, 240, 210),
    )

    patch = patch.resize(
        (REGION[2] - REGION[0], REGION[3] - REGION[1]),
        Image.Resampling.LANCZOS,
    )
    source.alpha_composite(patch, (REGION[0], REGION[1]))
    source.save(output_path, optimize=True)


if __name__ == '__main__':
    main()
