import os

# Let's inspect available fonts

def find_font():
    fonts = [
        "/System/Library/Fonts/Kohinoor.ttc",
        "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc",
        "/System/Library/Fonts/Supplemental/ITFDevanagari.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
    ]
    for f in fonts:
        if os.path.exists(f):
            return f
    return None

print("Font found:", find_font())
