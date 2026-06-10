from PIL import Image

try:
    img = Image.open('frontend/assets/images/certificate.png')
    pixels = img.load()
    width, height = img.size
    
    y_start = int(height * 0.25)
    y_end = int(height * 0.35)
    x_start = int(width * 0.25)
    x_end = int(width * 0.75)
    
    replaced = 0
    for y in range(y_start, y_end):
        for x in range(x_start, x_end):
            p = pixels[x, y]
            if p[0] < 100 and p[1] < 100 and p[2] < 150:
                sample_x = max(0, x - 50)
                pixels[x, y] = pixels[sample_x, y]
                replaced += 1
                
    print(f"Replaced {replaced} pixels in the name region of certificate.png.")
    img.save('frontend/assets/images/certificate_fixed.png')
    print("Saved to certificate_fixed.png")
except Exception as e:
    print(e)
