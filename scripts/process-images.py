#!/usr/bin/env python3
"""
把生图产出的原图处理成网站用的素材。

做三件事：
1. 裁切到设计需要的画幅，并按用途限制尺寸（纹理类不需要原图那么大的分辨率）
2. 输出 AVIF + WebP 两种格式（AVIF 更小，WebP 覆盖面更广）
3. 打一层极轻的颗粒，抵消 AI 生图常见的那种"过度平滑"的塑料感

用法：python3 scripts/process-images.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets-raw"
OUT = ROOT / "public" / "textures"


def run(cmd: list[str]) -> None:
    """执行外部命令，失败时抛出并带上 stderr。"""
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"{' '.join(cmd)}\n{proc.stderr}")


def encode_wide_and_small(
    img: Image.Image,
    stem: str,
    quality_avif: int,
    quality_webp: int,
) -> None:
    """
    输出两种宽度：桌面用原尺寸，窄屏用 900px。

    首屏的纸纹是背景图，手机上没必要下载 1600px 宽的那一份——
    在 390px 宽、3x 屏的手机上，900px 已经够用，体积却只有一半。
    """
    encode(img, stem, quality_avif, quality_webp)
    small = img.copy()
    small.thumbnail((900, 900), Image.LANCZOS)
    encode(small, f"{stem}-sm", quality_avif, quality_webp)


def encode(img: Image.Image, stem: str, quality_avif: int = 50, quality_webp: int = 78) -> None:
    """输出 avif + webp 两种格式。"""
    OUT.mkdir(parents=True, exist_ok=True)

    png = OUT / f"{stem}.png"
    img.save(png, "PNG", optimize=True)

    avif = OUT / f"{stem}.avif"
    run([
        "avifenc", "--min", "20", "--max", "32", "-s", "6",
        "-a", "end-usage=q", "-a", f"cq-level={quality_avif}",
        str(png), str(avif),
    ])

    webp = OUT / f"{stem}.webp"
    img.save(webp, "WEBP", quality=quality_webp, method=6)

    png.unlink()  # 中间产物，不进仓库

    for f in (avif, webp):
        print(f"  {f.name:28s} {f.stat().st_size / 1024:8.1f} KB")


def cover(img: Image.Image, ratio: float, anchor: str = "center") -> Image.Image:
    """按目标宽高比裁切，尽量保住画面重心。"""
    w, h = img.size
    target_h = int(w / ratio)
    if target_h <= h:
        if anchor == "center":
            top = (h - target_h) // 2
        elif anchor == "bottom":
            top = h - target_h
        else:  # top
            top = 0
        return img.crop((0, top, w, top + target_h))
    target_w = int(h * ratio)
    left = (w - target_w) // 2
    return img.crop((left, 0, left + target_w, h))


def add_grain(img: Image.Image, amount: float = 0.035) -> Image.Image:
    """
    叠一层极细的颗粒。

    AI 生图在高光处往往过于干净顺滑，缺乏真实照片的银盐颗粒，
    这是"AI 味"最直观的来源之一。加一点点噪声就能明显缓解。
    """
    import random

    w, h = img.size
    # 在小尺寸上生成噪声再放大，避免逐像素 Python 循环过慢
    sw, sh = max(1, w // 3), max(1, h // 3)
    rnd = random.Random(20261006)  # 固定种子，保证每次构建产物一致
    noise = Image.new("L", (sw, sh))
    noise.putdata([rnd.randint(0, 255) for _ in range(sw * sh)])
    noise = noise.resize((w, h), Image.BILINEAR)

    # 把噪声转成以中灰为中心的扰动层，用柔光方式合成
    noise = noise.point(lambda v: int(128 + (v - 128) * amount * 4))
    return Image.blend(img, Image.composite(img, noise.convert("RGB"), noise), 0.5)


def load(name: str) -> Image.Image:
    path = RAW / name
    if not path.exists():
        sys.exit(f"缺少原图：{path}")
    return Image.open(path).convert("RGB")


def main() -> None:
    print("处理 hero 背光纸（皮影幕布）")
    hero = load("hero-paper.png")
    hero = cover(hero, 16 / 9)
    # 这张会作为大面积氛围层铺在首屏，做一次轻微降噪让渐变更干净
    hero = hero.filter(ImageFilter.GaussianBlur(0.4))
    hero = hero.resize((1600, 900), Image.LANCZOS)
    hero = ImageEnhance.Contrast(hero).enhance(1.04)
    encode_wide_and_small(hero, "screen-glow", quality_avif=48, quality_webp=74)

    print("处理亮色纸纹")
    paper = load("paper-light.png")
    paper = cover(paper, 16 / 9)
    paper = paper.resize((1600, 900), Image.LANCZOS)
    paper = ImageEnhance.Contrast(paper).enhance(0.92)
    encode_wide_and_small(paper, "paper", quality_avif=46, quality_webp=72)

    print("处理皮影戏台")
    show = load("shadow-play.png")
    show = cover(show, 3 / 2)
    show = show.resize((1200, 800), Image.LANCZOS)
    show = add_grain(show, 0.03)
    encode(show, "shadow-play", quality_avif=54, quality_webp=80)

    print(f"\n完成，输出目录：{OUT}")


if __name__ == "__main__":
    main()
