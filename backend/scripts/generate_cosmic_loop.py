import math
import random
import numpy as np
import cv2

def create_cosmic_loop(
    image_path: str,
    output_mp4: str,
    width: int = 720,
    height: int = 1280,
    fps: int = 30,
    duration_sec: float = 8.0,
):
    print(f"Loading base image from {image_path}...")
    base_img = cv2.imread(image_path)
    if base_img is None:
        raise ValueError(f"Could not read image from {image_path}")

    # Resize base image with padding/crop to exact aspect ratio
    orig_h, orig_w = base_img.shape[:2]
    target_aspect = width / height
    orig_aspect = orig_w / orig_h

    if orig_aspect > target_aspect:
        # Image is wider: crop width
        new_w = int(orig_h * target_aspect)
        start_x = (orig_w - new_w) // 2
        cropped = base_img[:, start_x : start_x + new_w]
    else:
        # Image is taller: crop height
        new_h = int(orig_w / target_aspect)
        start_y = (orig_h - new_h) // 2
        cropped = base_img[start_y : start_y + new_h, :]

    # Higher resolution canvas for smooth zooming (e.g. 1.08x)
    canvas_w = int(width * 1.1)
    canvas_h = int(height * 1.1)
    canvas = cv2.resize(cropped, (canvas_w, canvas_h), interpolation=cv2.INTER_LANCZOS4)

    total_frames = int(fps * duration_sec)
    print(f"Generating {total_frames} frames ({duration_sec}s @ {fps}fps, {width}x{height})...")

    # Particle system (seamless loop)
    num_particles = 70
    random.seed(42)
    particles = []
    for _ in range(num_particles):
        x_base = random.uniform(40, width - 40)
        y_speed = random.uniform(30, 80) # pixels per loop
        initial_y = random.uniform(0, height)
        radius = random.uniform(1.2, 3.2)
        drift_amp = random.uniform(10, 25)
        drift_freq = random.choice([1, 2, 3])
        gold_shade = random.uniform(0.7, 1.0)
        particles.append({
            'x_base': x_base,
            'initial_y': initial_y,
            'y_speed': y_speed,
            'radius': radius,
            'drift_amp': drift_amp,
            'drift_freq': drift_freq,
            'gold_shade': gold_shade,
        })

    # Video writer with avc1
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    writer = cv2.VideoWriter(output_mp4, fourcc, fps, (width, height))
    if not writer.isOpened():
        print("Falling back to mp4v codec...")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(output_mp4, fourcc, fps, (width, height))

    margin_x = (canvas_w - width) // 2
    margin_y = (canvas_h - height) // 2

    # Aura mask on upper half (celestial wheel of time)
    wheel_y = int(height * 0.22)
    wheel_x = int(width * 0.5)
    wheel_radius = int(width * 0.38)
    y_coords, x_coords = np.ogrid[:height, :width]
    dist_from_wheel = np.sqrt((x_coords - wheel_x) ** 2 + (y_coords - wheel_y) ** 2)
    wheel_mask = np.clip(1.0 - (dist_from_wheel / wheel_radius), 0, 1)
    wheel_mask = (wheel_mask ** 2) * 0.22  # subtle max boost

    for f in range(total_frames):
        phase = (2 * math.pi * f) / total_frames
        
        # 1. Subtle breathing zoom & pan (seamless periodic sine wave)
        # Zoom from 1.00 to 1.035
        zoom_factor = 1.0 + 0.035 * (0.5 - 0.5 * math.cos(phase))
        cur_w = int(width * zoom_factor)
        cur_h = int(height * zoom_factor)
        
        # Centered crop on canvas
        crop_x = margin_x - (cur_w - width) // 2
        crop_y = margin_y - (cur_h - height) // 2
        # Slight sinusoidal pan
        crop_x += int(4 * math.sin(phase))
        crop_y += int(3 * math.sin(phase * 2))
        
        frame_crop = canvas[crop_y : crop_y + cur_h, crop_x : crop_x + cur_w]
        frame = cv2.resize(frame_crop, (width, height), interpolation=cv2.INTER_LINEAR).astype(np.float32)

        # 2. Celestial wheel light pulsation
        pulse = 0.5 + 0.5 * math.sin(phase * 2) # 2 cycles per loop
        glow = wheel_mask * pulse
        # Apply warm golden radiance: BGR (B += glow*40, G += glow*80, R += glow*120)
        frame[:, :, 0] += glow * 35
        frame[:, :, 1] += glow * 75
        frame[:, :, 2] += glow * 115

        # 3. Add golden floating particles
        particle_layer = np.zeros_like(frame)
        t_norm = f / total_frames # 0.0 to 1.0
        for p in particles:
            # Wrap y position seamlessly
            y = (p['initial_y'] - t_norm * height * 0.4) % height
            x = p['x_base'] + p['drift_amp'] * math.sin(2 * math.pi * p['drift_freq'] * t_norm)
            
            # Particle alpha fades at top and bottom edges for seamless loop
            edge_fade = math.sin(math.pi * (y / height))
            if edge_fade > 0:
                rad = int(round(p['radius']))
                color = (
                    int(80 * p['gold_shade'] * edge_fade),
                    int(190 * p['gold_shade'] * edge_fade),
                    int(255 * p['gold_shade'] * edge_fade),
                )
                cv2.circle(particle_layer, (int(x), int(y)), rad, color, -1, lineType=cv2.LINE_AA)
                # Outer soft blur halo
                cv2.circle(particle_layer, (int(x), int(y)), rad + 2, (color[0] // 3, color[1] // 3, color[2] // 3), -1, lineType=cv2.LINE_AA)

        # Blend particles
        frame = np.clip(frame + particle_layer, 0, 255).astype(np.uint8)
        writer.write(frame)

    writer.release()
    print(f"Cosmic loop video generated successfully at {output_mp4}!")

if __name__ == "__main__":
    create_cosmic_loop(
        image_path="backend/data/media/gita_cosmic_katha.jpg",
        output_mp4="backend/data/media/gita_cosmic_katha_loop.mp4",
    )
