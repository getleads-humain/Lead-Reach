#!/usr/bin/env python3
"""
Update globals.css for Pitch Deep Royal Black dark theme.

Key changes:
- Background: oklch(0.02 0.002 270) → oklch(0.01 0.006 270)  [Pitch Deep Royal Black]
- Card:       oklch(0.07 0.004 270) → oklch(0.04 0.005 270)  [subtle lift from pitch black]
- Popover:    oklch(0.08 0.004 270) → oklch(0.05 0.005 270)  [slightly above card]
- Secondary:  oklch(0.10 0.006 270) → oklch(0.06 0.006 270)  [elevated surfaces]
- Sidebar:    oklch(0.03 0.003 270) → oklch(0.015 0.005 270) [near-pure-black sidebar]
- Foreground: oklch(0.96 0.004 270) → oklch(0.97 0.004 270)  [brighter near-white]
- Muted FG:   oklch(0.68 0.010 270) → oklch(0.72 0.010 270)  [readable secondary]
- Border:     oklch(0.16 0.006 270) → oklch(0.18 0.008 270)  [more visible]
- Cmp border: oklch(0.14 0.006 270) → oklch(0.15 0.007 270)  [component borders]
- Sec text:   oklch(0.92 0.005 270) → oklch(0.94 0.005 270)  [brighter secondary text]
- Cell text:  oklch(0.90 0.005 270) → oklch(0.92 0.005 270)  [brighter cell text]
- Tabs text:  oklch(0.65 0.008 270) → oklch(0.68 0.008 270)  [brighter inactive tabs]
- Td border:  oklch(0.12 0.006 270) → oklch(0.13 0.006 270)  [slightly brighter]
- Glass:      oklch(0.04 0.003 270) → oklch(0.03 0.004 270)  [glass bg on pitch black]
- Sheet:      oklch(0.05 0.003 270) → oklch(0.035 0.004 270) [sheet bg]
- Scrollbar:  oklch(0.22 0.008 270) → oklch(0.20 0.008 270)  [scrollbar thumb]
- Placeholder: oklch(0.42 0.005 270) → oklch(0.48 0.005 270) [brighter placeholder]
"""

import re

filepath = "/home/z/my-project/src/app/globals.css"

with open(filepath, "r") as f:
    content = f.read()

# Define all replacements as (old, new) pairs
# Order matters - do more specific replacements first to avoid partial matches
replacements = [
    # ── Backgrounds (deeper = Pitch Deep Royal Black) ──
    ("oklch(0.02 0.002 270)", "oklch(0.01 0.006 270)"),    # Background - THE Pitch Deep Royal Black
    ("oklch(0.07 0.004 270)", "oklch(0.04 0.005 270)"),    # Card surfaces
    ("oklch(0.08 0.004 270)", "oklch(0.05 0.005 270)"),    # Popover surfaces
    ("oklch(0.10 0.006 270)", "oklch(0.06 0.006 270)"),    # Secondary/Muted/Accent/Input
    ("oklch(0.03 0.003 270)", "oklch(0.015 0.005 270)"),   # Sidebar
    ("oklch(0.05 0.003 270)", "oklch(0.035 0.004 270)"),   # Sheet content

    # ── Glass surfaces (on pitch black) ──
    ("oklch(0.04 0.003 270)", "oklch(0.03 0.004 270)"),    # Glass bg

    # ── Foreground text (brighter for visibility) ──
    ("oklch(0.96 0.004 270)", "oklch(0.97 0.004 270)"),    # Primary foreground text
    ("oklch(0.92 0.005 270)", "oklch(0.94 0.005 270)"),    # Secondary/accent text
    ("oklch(0.90 0.005 270)", "oklch(0.92 0.005 270)"),    # Table cell text
    ("oklch(0.68 0.010 270)", "oklch(0.72 0.010 270)"),    # Muted foreground
    ("oklch(0.65 0.008 270)", "oklch(0.68 0.008 270)"),    # Tabs trigger inactive

    # ── Borders (more visible against pitch black) ──
    ("oklch(0.16 0.006 270)", "oklch(0.18 0.008 270)"),    # Main border
    ("oklch(0.14 0.006 270)", "oklch(0.15 0.007 270)"),    # Component/sidebar borders
    ("oklch(0.12 0.006 270)", "oklch(0.13 0.006 270)"),    # TD border

    # ── Scrollbar ──
    ("oklch(0.22 0.008 270)", "oklch(0.20 0.008 270)"),    # Scrollbar thumb

    # ── Placeholder (brighter) ──
    ("oklch(0.42 0.005 270)", "oklch(0.48 0.005 270)"),    # Placeholder text

    # ── Pre/code backgrounds ──
    ("oklch(0.06 0.004 270)", "oklch(0.035 0.005 270)"),   # Pre, command, radix popper

    # ── Boost text-gray-500 equivalents ──
    ("oklch(0.70 0.005 270)", "oklch(0.72 0.006 270)"),    # Boosted gray-500/slate-500

    # ── Small text minimum brightness ──
    ("oklch(0.82 0.006 270)", "oklch(0.84 0.006 270)"),    # Small text boost

    # ── Breadcrumb text ──
    ("oklch(0.75 0.005 270)", "oklch(0.78 0.005 270)"),    # Breadcrumb / recharts text
]

# Track how many replacements were made
total_replacements = 0
for old, new in replacements:
    count = content.count(old)
    if count > 0:
        content = content.replace(old, new)
        total_replacements += count
        print(f"  ✓ {old} → {new}  ({count} occurrences)")
    else:
        print(f"  - {old}  (not found, skipping)")

# Update the dark mode header comment
content = content.replace(
    "DARK MODE — Ultra Deep Pitch-Black Premium Theme",
    "DARK MODE — Pitch Deep Royal Black Premium Theme"
)
content = content.replace(
    "Pure #000000-adjacent backgrounds with vibrant eye-catching",
    "Pitch Deep Royal Black (oklch 0.01) backgrounds with vibrant eye-catching"
)
content = content.replace(
    "   Body is truly pitch black.",
    "   Body is Pitch Deep Royal Black — the deepest possible with royal blue depth."
)

# Update the on-pitch-black comment references
content = content.replace(
    "On pitch-black backgrounds (oklch 0.02), low-opacity text is",
    "On Pitch Deep Royal Black backgrounds (oklch 0.01), low-opacity text is"
)
content = content.replace(
    "   The base muted-foreground was oklch(0.62) — too dim for",
    "   The base muted-foreground was oklch(0.68) — boosted to 0.72 for"
)
content = content.replace(
    "   small/secondary text on pure black. Boosted to 0.68.",
    "   small/secondary text on Pitch Deep Royal Black. Boosted to 0.72."
)

# Update the "fix main content area" comment
content = content.replace(
    "/* Fix the main content area background to be truly pitch black */",
    "/* Fix the main content area background — Pitch Deep Royal Black */"
)

# Update the body background comment
content = content.replace(
    "/* Fix the body background — make absolutely sure it's pitch black */",
    "/* Fix the body background — Pitch Deep Royal Black (deepest possible) */"
)

with open(filepath, "w") as f:
    f.write(content)

print(f"\n✅ Total replacements: {total_replacements}")
print(f"✅ Updated {filepath}")
