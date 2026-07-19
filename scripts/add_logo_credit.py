from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFont


TEXT = 'created by Sean'
CANVAS_HEIGHT = 488
FONT_PATH = Path(r'C:\Windows\Fonts\trebucbd.ttf')


def main():
    if len(sys.argv) != 3:
        raise SystemExit('usage: add_logo_credit.py INPUT OUTPUT')
    source = Image.open(sys.argv[1]).convert('RGBA')
    if source.height >= CANVAS_HEIGHT:
        raise SystemExit(f'expected a logo shorter than {CANVAS_HEIGHT}px')

    result = Image.new('RGBA', (source.width, CANVAS_HEIGHT), (0, 0, 0, 0))
    result.alpha_composite(source, (0, 0))
    draw = ImageDraw.Draw(result)
    font = ImageFont.truetype(str(FONT_PATH), 28)
    stroke_width = 2
    bounds = draw.textbbox((0, 0), TEXT, font=font, stroke_width=stroke_width)
    text_width = bounds[2] - bounds[0]
    x = (source.width - text_width) / 2 - bounds[0]
    y = 442 - bounds[1]

    draw.text(
        (x + 2, y + 3), TEXT, font=font,
        fill=(13, 86, 112, 230), stroke_width=stroke_width,
        stroke_fill=(30, 36, 40, 235),
    )
    draw.text(
        (x, y), TEXT, font=font,
        fill=(255, 238, 188, 255), stroke_width=stroke_width,
        stroke_fill=(72, 42, 24, 255),
    )
    result.save(sys.argv[2], optimize=True)


if __name__ == '__main__':
    main()
