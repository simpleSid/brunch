from pathlib import Path

from PIL import Image, ImageDraw


WIDTH = 1882
HEIGHT = 1080
OUT = Path(__file__).with_name("reflection-mask.png")


def main() -> None:
    mask = Image.new("L", (WIDTH, HEIGHT), 0)
    draw = ImageDraw.Draw(mask)

    # The strongest camera-person reflection sits in the upper right door glass
    # during the exterior-to-interior move. Keep the mask narrow so the seated
    # guests visible through the lower glass are preserved.
    draw.ellipse((1078, 150, 1188, 286), fill=255)
    draw.polygon(
        [
            (1058, 276),
            (1192, 268),
            (1210, 414),
            (1158, 492),
            (1034, 482),
            (1016, 374),
        ],
        fill=255,
    )
    draw.polygon(
        [
            (1002, 336),
            (1072, 316),
            (1100, 390),
            (1028, 444),
            (984, 420),
        ],
        fill=255,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    mask.save(OUT)


if __name__ == "__main__":
    main()
