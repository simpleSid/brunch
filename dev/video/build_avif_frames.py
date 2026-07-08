from __future__ import annotations

import os
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VIDEO_DIR = ROOT / "dev" / "video"
SOURCE = VIDEO_DIR / "brunch-window-source.mp4"
FRAMES_DIR = ROOT / "assets" / "hero" / "frames"
FRAME_COUNT = 440
WIDTH = 1600


def run(command: list[str], quiet: bool = False) -> None:
    subprocess.run(
        command,
        cwd=ROOT,
        check=True,
        stdout=subprocess.DEVNULL if quiet else None,
        stderr=subprocess.STDOUT if quiet else None,
    )


def encode_one(index: int, png_dir: Path) -> None:
    src = png_dir / f"brunch_{index:04d}.png"
    dst = FRAMES_DIR / f"brunch_{index:04d}.avif"

    run(
        [
            "avifenc",
            "-q",
            "60",
            "-s",
            "8",
            "-j",
            "1",
            "-y",
            "420",
            str(src),
            str(dst),
        ],
        quiet=True,
    )


def main() -> None:
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="brunch-avif-") as tmp:
        png_dir = Path(tmp)
        png_pattern = png_dir / "brunch_%04d.png"
        filtergraph = f"fps=44,scale={WIDTH}:-2"

        run(
            [
                "ffmpeg",
                "-hide_banner",
                "-y",
                "-i",
                str(SOURCE),
                "-vf",
                filtergraph,
                "-frames:v",
                str(FRAME_COUNT),
                str(png_pattern),
            ]
        )

        workers = min(4, max(1, os.cpu_count() or 1))
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(encode_one, index, png_dir): index for index in range(1, FRAME_COUNT + 1)}

            for completed, future in enumerate(as_completed(futures), start=1):
                future.result()

                if completed % 40 == 0 or completed == FRAME_COUNT:
                    print(f"encoded {completed}/{FRAME_COUNT}", flush=True)


if __name__ == "__main__":
    main()
