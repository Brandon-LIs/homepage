#!/usr/bin/env python3
"""
生成标题用的中文字体子集。

为什么需要这一步：这个站点的标题是宋体。全量 Noto Serif SC 有 12 MB，
直接丢给浏览器不现实；而标题用到的汉字其实只有几百个。
按页面实际出现的字符子集化后，产物只有 120 KB 左右。

前置：
    python3 -m venv /tmp/fontenv
    /tmp/fontenv/bin/pip install fonttools brotli
    下载 https://github.com/notofonts/noto-cjk/raw/main/Serif/SubsetOTF/SC/NotoSerifSC-Bold.otf

用法：
    /tmp/fontenv/bin/python3 scripts/build-font-subset.py /path/to/NotoSerifSC-Bold.otf

字体许可：Noto Serif SC 采用 SIL Open Font License 1.1，
允许自由使用、修改与再分发（含商用）。
"""
from __future__ import annotations

import pathlib
import re
import subprocess
import sys
from pathlib import Path

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "public" / "fonts" / "songti-700.woff2"

# 全站会出现的标点、数字与拉丁字符，避免中英混排时缺字回落
EXTRA = (
    "0123456789"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    " .,:;!?()[]{}<>/\\|-–—_'\"`~@#$%^&*+=·、。，；：？！（）「」『』"
    "《》〈〉【】…‰°“”‘’"
)


def collect_chars() -> tuple[set[str], set[str]]:
    """
    收集所有会渲染到页面上的字符。返回 (必含字符, 可选字符)。

    必须覆盖四处，少一处就会漏字：
      - src/**/*.ts, src/**/*.astro   页面与组件的文字
      - scripts/build-og.mjs          分享卡片上的文字（不在 src 里）
      - src/data/posts.json           博客文章的标题与摘要

    最后一项是最容易漏、后果最严重的：它由构建期抓取 RSS 生成，
    内容随博客更新而变化。曾经因为没扫它，页面上 62 个汉字
    （鼠标垫、贵阳、崩溃、链接……）在标题字体里没有字形，
    回落成系统字体，同一句话里出现两种字体，非常难看。

    另外返回一份"可选字符"：GB2312 全集汉字（6763 个）排除已必含的。
    这些是给博客未来内容留的余量——不能只为今天这几篇文章准备字形，
    否则每发一篇新文章又会缺字。母集只在构建期使用、不进部署产物，
    所以这里可以用全集，换来"任何常见中文都不会缺字"。
    """
    targets: list[Path] = list(SRC.rglob("*.ts")) + list(SRC.rglob("*.astro"))

    og_script = ROOT / "scripts" / "build-og.mjs"
    if og_script.exists():
        targets.append(og_script)

    # 关键：把构建期生成的文章数据也算进来
    posts_json = ROOT / "src" / "data" / "posts.json"
    if posts_json.exists():
        targets.append(posts_json)

    required: set[str] = set()
    for path in targets:
        text = path.read_text(encoding="utf-8")
        # 注释不会渲染，去掉以免把注释里的字也塞进子集
        text = re.sub(r"/\*[\s\S]*?\*/", "", text)
        text = re.sub(r"^\s*//.*$", "", text, flags=re.M)
        for ch in text:
            if "\u4e00" <= ch <= "\u9fff" or ch in EXTRA:
                required.add(ch)

    required.update(EXTRA)

    # GB2312 一级常用汉字作为余量。不用全量 6763 字：那会让字体
    # 从 125 KB 涨到 1.4 MB，而一级字表已经覆盖日常中文的 99.7%。
    optional = gb2312_full() - required
    return required, optional


def gb2312_full() -> set[str]:
    """
    GB2312 全集汉字（6763 个），作为母集的覆盖范围。

    一开始只用了一级常用字（3755 个），结果测试文章里的「腌」「笃」
    （二级字）取不到字形，子集自检直接报错。既然母集只在构建期使用、
    不进部署产物，那就用全集，让任何常见中文都能渲染。

    直接用 Python 内置的 gb2312 编解码器枚举，不依赖外部字表文件。
    """
    chars: set[str] = set()
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                ch = bytes([hi, lo]).decode("gb2312")
            except UnicodeDecodeError:
                continue
            if "\u4e00" <= ch <= "\u9fff":
                chars.add(ch)
    return chars


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src_font = pathlib.Path(sys.argv[1])
    if not src_font.exists():
        sys.exit(f"找不到源字体：{src_font}")

    required, optional = collect_chars()
    print(f"必含字符 {len(required)} 个，余量字符 {len(optional)} 个")

    fonts = [
        # 母集：构建后脚本从这里精确子集化。
        # 必须包含余量字符，否则新文章的字无从取出。
        (required | optional, ROOT / "assets" / "fonts" / "songti-master.woff2", ["--flavor=woff2"]),
        # 页面种子：只带源码必含字符。首次构建若构建后脚本没跑，
        # 页面也有字体可用，不至于完全没样式。
        (required, OUT, ["--flavor=woff2"]),
        # 分享卡片用的 TTF：Satori 不认 woff2
        (required, ROOT / "assets" / "fonts" / "songti-700.ttf", []),
    ]

    for charset, out_path, extra in fonts:
        char_file = ROOT / ".font-chars.txt"
        char_file.write_text("".join(sorted(charset)), encoding="utf-8")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                sys.executable.replace("python", "pyftsubset"),
                str(src_font),
                f"--text-file={char_file}",
                "--layout-features=*",
                "--no-hinting",
                "--desubroutinize",
                *extra,
                f"--output-file={out_path}",
            ],
            check=True,
        )
        char_file.unlink()
        print(f"  {out_path.name:26s} {len(charset):5d} 字  "
              f"{out_path.stat().st_size / 1024:7.1f} KB")


if __name__ == "__main__":
    main()
