#!/usr/bin/env python3
"""
把博客 RSS 里的封面图处理成与站点配色的风格。

博客封面本身是彩色的（蓝、绿、紫什么都有），直接贴到这套朱砂橙 + 纸白的
页面上会很跳。这里把它们统一降到低饱和，只保留明暗结构，
让配图成为版面的一部分而不是噪点。

用法：python3 scripts/process-covers.py
"""
from __future__ import annotations

import subprocess
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets-raw" / "covers"
OUT = ROOT / "public" / "covers"

# 与 site.ts 中 RSS 快照对应的封面
COVERS = {
    "blogsclub-friend-link":
        "https://jsd.oopss.top/gh/Brandon-LIs/paper@refs/heads/main/lite.webp",
    "free-mousepad-by-bc":
        "https://jsd.onmicrosoft.cn/npm/br-blog@1.0.11/covers/1789271159758-sm.webp",
    "guiyang-trip":
        "https://jsd.onmicrosoft.cn/npm/br-blog@1.0.11/covers/1788159846637-sm.webp",
    "tech-add-ai-search-to-blog":
        "https://jsd.onmicrosoft.cn/npm/br-blog@1.0.11/covers/08220001-sm.webp",
}

SIZE = (600, 420)  # 3:2 略宽于展示比例，留出裁切余量


def download(url: str, dest: Path) -> bool:
    if dest.exists():
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as r:
            dest.write_bytes(r.read())
        return True
    except Exception as exc:  # noqa: BLE001 - 网络问题不该让整批失败
        print(f"  下载失败 {dest.name}: {exc}")
        return False


def style_image(src: Path, dest_stem: Path) -> None:
    img = Image.open(src).convert("RGB")

    # 按目标比例居中裁切
    tw, th = SIZE
    sw, sh = img.size
    target = tw / th
    if sw / sh > target:
        nw = int(sh * target)
        img = img.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    else:
        nh = int(sw / target)
        img = img.crop((0, (sh - nh) // 2, sw, (sh - nh) // 2 + nh))
    img = img.resize(SIZE, Image.LANCZOS)

    # 降饱和：彩色封面会把注意力从文字上抢走
    img = ImageEnhance.Color(img).enhance(0.42)
    # 略提对比，抵消降饱和带来的发灰
    img = ImageEnhance.Contrast(img).enhance(1.04)

    OUT.mkdir(parents=True, exist_ok=True)
    webp = dest_stem.with_suffix(".webp")
    avif = dest_stem.with_suffix(".avif")
    img.save(webp, "WEBP", quality=76, method=6)

    png = dest_stem.with_suffix(".png")
    img.save(png, "PNG")
    subprocess.run(
        ["avifenc", "--min", "20", "--max", "34", "-s", "6",
         "-a", "end-usage=q", "-a", "cq-level=52", str(png), str(avif)],
        check=True, capture_output=True,
    )
    png.unlink()

    print(f"  {webp.name:34s} {webp.stat().st_size / 1024:6.1f} KB  |  "
          f"{avif.name} {avif.stat().st_size / 1024:6.1f} KB")


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    ok = 0
    for slug, url in COVERS.items():
        raw = RAW / f"{slug}.webp"
        if not download(url, raw):
            continue
        print(f"处理 {slug}")
        try:
            style_image(raw, OUT / slug)
            ok += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  失败: {exc}")
    print(f"\n完成 {ok}/{len(COVERS)} 张，输出目录：{OUT}")
    if ok == 0:
        sys.exit("没有处理成功任何封面")


if __name__ == "__main__":
    main()
