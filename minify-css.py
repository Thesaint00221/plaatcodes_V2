#!/usr/bin/env python3
"""
Genereert style.min.css uit style.css.

Gebruik: pas altijd style.css aan (leesbare bron), draai daarna dit
script opnieuw en commit zowel style.css als style.min.css.

    python3 build/minify-css.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRON = ROOT / "style.css"
DOEL = ROOT / "style.min.css"


def minify(css: str) -> str:
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{}:;,])\s*", r"\1", css)
    css = re.sub(r";}", "}", css)
    return css.strip()


def main():
    bron_css = BRON.read_text(encoding="utf-8")
    mini_css = minify(bron_css)
    DOEL.write_text(mini_css, encoding="utf-8")
    print(
        f"{BRON.name}: {len(bron_css)} bytes -> "
        f"{DOEL.name}: {len(mini_css)} bytes "
        f"({100 - round(len(mini_css) / len(bron_css) * 100)}% kleiner)"
    )


if __name__ == "__main__":
    main()
