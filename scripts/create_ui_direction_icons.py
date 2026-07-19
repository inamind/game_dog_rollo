from pathlib import Path

from PIL import Image, ImageDraw


OUTPUT_DIR = Path(__file__).resolve().parents[1] / 'image_sources'
SIZE = 96
SCALE = 4


def create_up_arrow():
    image = Image.new('RGBA', (SIZE * SCALE, SIZE * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    points = [(48, 9), (86, 45), (70, 61), (58, 49), (58, 86),
              (38, 86), (38, 49), (26, 61), (10, 45)]
    scaled = [(x * SCALE, y * SCALE) for x, y in points]
    draw.polygon(scaled, fill=(36, 51, 66, 255))
    inner = [(48, 16), (78, 45), (69, 54), (53, 38), (53, 80),
             (43, 80), (43, 38), (27, 54), (18, 45)]
    draw.polygon([(x * SCALE, y * SCALE) for x, y in inner], fill=(255, 255, 255, 255))
    highlight = [(48, 23), (67, 42), (63, 46), (51, 34), (51, 70),
                 (47, 70), (47, 34), (33, 48), (29, 44)]
    draw.polygon([(x * SCALE, y * SCALE) for x, y in highlight], fill=(223, 246, 255, 190))
    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def main():
    up = create_up_arrow()
    directions = {
        'up': up,
        'right': up.rotate(-90, resample=Image.Resampling.BICUBIC),
        'down': up.rotate(180, resample=Image.Resampling.BICUBIC),
        'left': up.rotate(90, resample=Image.Resampling.BICUBIC),
    }
    for direction, image in directions.items():
        image.save(OUTPUT_DIR / f'ui_direction_{direction}.png', optimize=True)


if __name__ == '__main__':
    main()
