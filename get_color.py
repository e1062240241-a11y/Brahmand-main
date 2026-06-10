from PIL import Image
import sys

try:
    img = Image.open('frontend/assets/images/gita_cert.png')
    width, height = img.size
    
    points = [
        (0.5, 0.31),
        (0.2, 0.31),
        (0.8, 0.31),
        (0.5, 0.28),
        (0.5, 0.33),
        (0.2, 0.64),
        (0.24, 0.64)
    ]
    
    for px, py in points:
        x = int(width * px)
        y = int(height * py)
        crop = img.crop((x-5, y-5, x+5, y+5))
        colors = crop.getcolors(100)
        colors.sort(key=lambda t: t[0], reverse=True)
        dom_color = colors[0][1]
        print(f"Point ({px}, {py}): {dom_color}")

except Exception as e:
    print(e)
