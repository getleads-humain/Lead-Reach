#!/usr/bin/env python3
"""
Replace hardcoded hex colors and text-white/border-white patterns in workforce
components with semantic theme tokens that respect the Pitch Deep Royal Black
dark theme.
"""

import os

def replace_in_file(filepath: str) -> dict:
    with open(filepath, "r") as f:
        content = f.read()
    
    original = content
    counts = {}
    
    # ── Background replacements ──
    # bg-[#0a0a0f] → bg-background  (Pitch Deep Royal Black body)
    replacements = [
        ("bg-[#0a0a0f]", "bg-background"),
        # bg-[#111118] → bg-card  (card surfaces)
        ("bg-[#111118]", "bg-card"),
        # bg-[#1a1a24] → bg-input  (elevated/input surfaces)
        ("bg-[#1a1a24]", "bg-input"),
        
        # ── Border replacements ──
        # border-white/10 → border-border
        ("border-white/10", "border-border"),
        # border-white/5 → border-border/50
        ("border-white/5", "border-border/50"),
        # border-white/20 → border-border
        ("border-white/20", "border-border"),
        
        # ── Text replacements ──
        # text-white (standalone) → text-foreground
        # We need to be careful here - only replace standalone text-white
        # not text-white/50 etc. (those are handled separately)
        
        # text-white/30 → text-foreground/30 (very dim text)
        ("text-white/30", "text-foreground/30"),
        # text-white/40 → text-foreground/40
        ("text-white/40", "text-foreground/40"),
        # text-white/50 → text-foreground/50
        ("text-white/50", "text-foreground/50"),
        # text-white/60 → text-muted-foreground
        ("text-white/60", "text-muted-foreground"),
        # text-white/70 → text-foreground/70
        ("text-white/70", "text-foreground/70"),
        # text-white/80 → text-foreground/80
        ("text-white/80", "text-foreground/80"),
        # text-white/90 → text-foreground/90
        ("text-white/90", "text-foreground/90"),
        
        # ── Background hover/opacity replacements ──
        # bg-white/5 → bg-secondary/50
        ("bg-white/5", "bg-secondary/50"),
        # bg-white/10 → bg-secondary
        ("bg-white/10", "bg-secondary"),
        # bg-white/20 → bg-secondary
        ("bg-white/20", "bg-secondary"),
        # bg-white/80 → bg-secondary/80
        ("bg-white/80", "bg-secondary/80"),
        
        # ── Hover state replacements ──
        # hover:bg-white/5 → hover:bg-secondary/50
        ("hover:bg-white/5", "hover:bg-secondary/50"),
        # hover:bg-white/10 → hover:bg-secondary
        ("hover:bg-white/10", "hover:bg-secondary"),
        
        # ── Gradient replacements ──
        # from-white → from-secondary
        ("from-white", "from-secondary"),
        # to-white → to-secondary
        ("to-white", "to-secondary"),
    ]
    
    for old, new in replacements:
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            counts[old] = count
    
    # Now handle standalone text-white → text-foreground
    # Need to be careful: only replace "text-white" not preceded by "/" and not followed by "/"
    # We already replaced text-white/XX variants above, so remaining text-white are standalone
    import re
    # Replace text-white that is NOT part of text-white/XX (those are already handled)
    # After the above replacements, remaining text-white instances should be standalone
    count = content.count("text-white")
    if count > 0:
        content = content.replace("text-white", "text-foreground")
        counts["text-white"] = count
    
    if content != original:
        with open(filepath, "w") as f:
            f.write(content)
    
    return counts

# Process both workforce files
files = [
    "/home/z/my-project/src/components/workforce/workforce-dashboard.tsx",
    "/home/z/my-project/src/components/workforce/agent-workspace.tsx",
]

for filepath in files:
    print(f"\n{'='*60}")
    print(f"Processing: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    counts = replace_in_file(filepath)
    total = sum(counts.values())
    if counts:
        for old, count in counts.items():
            print(f"  ✓ {old} → (replaced)  ({count} occurrences)")
        print(f"\n  Total: {total} replacements")
    else:
        print("  No changes needed")
