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


def collect_chars() -> str:
    """
    扫描源码，收集所有会渲染到页面上的字符。

    必须同时覆盖两处，否则会漏字：
      - src/**           页面与组件的文字
      - scripts/build-og.mjs   分享卡片上的文字（它不在 src 里）

    漏字的后果不是报错，而是那个字在渲染时变成空白——曾经就因为
    只扫了 src，导致 OG 卡片上的「计算科学」少了「算」字。
    """
    targets = list(SRC.rglob("*.ts")) + list(SRC.rglob("*.astro"))
    og_script = ROOT / "scripts" / "build-og.mjs"
    if og_script.exists():
        targets.append(og_script)

    chars: set[str] = set()
    for path in targets:
        text = path.read_text(encoding="utf-8")
        # 注释不会渲染，去掉以免把注释里的字也塞进子集
        text = re.sub(r"/\*[\s\S]*?\*/", "", text)
        text = re.sub(r"^\s*//.*$", "", text, flags=re.M)
        for ch in text:
            if "\u4e00" <= ch <= "\u9fff" or ch in EXTRA:
                chars.add(ch)
    chars.update(EXTRA)
    return "".join(sorted(chars))


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src_font = pathlib.Path(sys.argv[1])
    if not src_font.exists():
        sys.exit(f"找不到源字体：{src_font}")

    chars = collect_chars()
    char_file = ROOT / ".font-chars.txt"
    char_file.write_text(chars, encoding="utf-8")
    print(f"收集到 {len(chars)} 个字符")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            sys.executable.replace("python", "pyftsubset"),
            str(src_font),
            f"--text-file={char_file}",
            "--flavor=woff2",
            "--layout-features=*",
            "--no-hinting",
            "--desubroutinize",
            f"--output-file={OUT}",
        ],
        check=True,
    )
    char_file.unlink()

    print(f"输出 {OUT}  ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
