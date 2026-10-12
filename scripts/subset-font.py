"""Subset Fusion Pixel Font (SIL OFL 1.1) to the characters Joker Poker displays.

Usage: python3 scripts/subset-font.py <fusion-pixel-12px-proportional-zh_hans.ttf.woff2>
Writes fonts/jkp-pixel.woff2; rerun after adding new text to src/.
"""
import pathlib
import sys

from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
text = "".join(p.read_text(encoding="utf-8") for p in (root / "src").rglob("*.js"))
chars = {c for c in text if ord(c) > 126 and not (0x1F000 <= ord(c) <= 0x1FFFF) and ord(c) not in (0xFE0F, 0x200D)}
chars |= {chr(i) for i in range(32, 127)}
chars |= set("×·…—–～（）：，。！？、％＄")
options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["*"]
font = subset.load_font(sys.argv[1], options)
subsetter = subset.Subsetter(options)
subsetter.populate(text="".join(sorted(chars)))
subsetter.subset(font)
out = root / "fonts" / "jkp-pixel.woff2"
subset.save_font(font, str(out), options)
print(f"{len(chars)} chars -> {out} ({out.stat().st_size} bytes)")
