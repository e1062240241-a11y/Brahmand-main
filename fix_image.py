from PIL import Image

try:
    img = Image.open('frontend/assets/images/gita_cert.png')
    pixels = img.load()
    width, height = img.size
    
    # Bounding box for 'S' - we observed it around 31% top, 50% left
    # Let's clean the area between top 25% and 35%, left 25% and 75%
    # But only replace dark pixels! (The 'S' is dark blue: (22, 35, 59))
    
    # We will sample the background color at the edges of the box
    bg_color = (250, 242, 228, 255) # approximate
    
    y_start = int(height * 0.25)
    y_end = int(height * 0.35)
    x_start = int(width * 0.25)
    x_end = int(width * 0.75)
    
    replaced = 0
    for y in range(y_start, y_end):
        for x in range(x_start, x_end):
            p = pixels[x, y]
            # Check if it's dark (ink)
            if p[0] < 100 and p[1] < 100 and p[2] < 150:
                # Replace with a background color sampled from nearby (e.g. 50 pixels to the left)
                # Ensure we don't go out of bounds
                sample_x = max(0, x - 50)
                pixels[x, y] = pixels[sample_x, y]
                replaced += 1
                
    print(f"Replaced {replaced} pixels in the name region.")
    
    # Now for the date! 
    # date is around top 62%-66%, left 10%-30%
    y_start_d = int(height * 0.62)
    y_end_d = int(height * 0.66)
    x_start_d = int(width * 0.10)
    x_end_d = int(width * 0.35)
    
    replaced_d = 0
    for y in range(y_start_d, y_end_d):
        for x in range(x_start_d, x_end_d):
            p = pixels[x, y]
            if p[0] < 100 and p[1] < 100 and p[2] < 150:
                sample_x = max(0, x - 50)
                pixels[x, y] = pixels[sample_x, y]
                replaced_d += 1
                
    print(f"Replaced {replaced_d} pixels in the date region.")
    
    img.save('frontend/assets/images/gita_cert_fixed.png')
    print("Saved to gita_cert_fixed.png")
except Exception as e:
    print(e)
