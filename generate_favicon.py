"""
CareerIQ Pro — Favicon Generator
─────────────────────────────────────────────────────────────────────────────────
Run this script to generate favicon.ico + all PWA icon sizes from scratch.
No Photoshop needed — everything is drawn in Python using Pillow.

Usage:
    pip install Pillow
    python generate_favicon.py

Output files (place in frontend/public/):
    favicon.ico          → 16×16 + 32×32 + 48×48 multi-size ICO
    logo192.png          → React PWA icon (192×192)
    logo512.png          → React PWA icon (512×512)
    apple-touch-icon.png → iOS home screen icon (180×180)
    og-image.png         → Social preview card (1200×630)
"""

from PIL import Image, ImageDraw, ImageFont
import struct
import os

# ─── Brand Config — Edit These ─────────────────────────────────────────────────
BRAND_INITIALS  = "IQ"          # Text shown in the icon (keep ≤2 chars)
BG_COLOR        = "#1A6BFF"     # Background — Electric Cobalt
TEXT_COLOR      = "#FFFFFF"     # Initials color
ACCENT_COLOR    = "#AAFF00"     # Dot / accent — Acid Lime
APP_NAME        = "CareerIQ Pro"
TAGLINE         = "AI-Driven Career Growth"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "frontend", "public")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ─── Helpers ───────────────────────────────────────────────────────────────────

def hex_to_rgb(hex_color: str) -> tuple:
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def draw_icon(size: int) -> Image.Image:
    """Draw the CareerIQ icon at `size`×`size` px."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    bg_rgb  = hex_to_rgb(BG_COLOR)
    txt_rgb = hex_to_rgb(TEXT_COLOR)
    acc_rgb = hex_to_rgb(ACCENT_COLOR)

    # ── Rounded-rect background ──
    r = int(size * 0.20)  # corner radius ≈ 20% of size
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=bg_rgb)

    # ── Text (initials) ──
    font_size = int(size * 0.40)
    try:
        # Try system fonts; fall back to default
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except Exception:
            font = ImageFont.load_default()

    bbox  = draw.textbbox((0, 0), BRAND_INITIALS, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1]

    draw.text((tx, ty), BRAND_INITIALS, fill=txt_rgb, font=font)

    # ── Accent dot (bottom-right) ──
    dot = max(int(size * 0.14), 4)
    margin = max(int(size * 0.06), 2)
    x0 = size - dot - margin
    y0 = size - dot - margin
    draw.ellipse([x0, y0, x0 + dot, y0 + dot], fill=acc_rgb)

    return img


def save_ico(images: list[tuple[int, Image.Image]], path: str):
    """Manually write a valid multi-size .ico file."""
    # Sort by size
    images = sorted(images, key=lambda x: x[0])
    n = len(images)

    pngs = []
    for _, img in images:
        import io
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        pngs.append(buf.getvalue())

    # ICO header
    header = struct.pack("<HHH", 0, 1, n)

    # Directory entries (16 bytes each)
    offset = 6 + n * 16
    entries = b""
    for i, (size, _) in enumerate(images):
        s = size if size < 256 else 0
        data_size = len(pngs[i])
        entries += struct.pack("<BBBBHHII", s, s, 0, 0, 1, 32, data_size, offset)
        offset += data_size

    with open(path, "wb") as f:
        f.write(header + entries + b"".join(pngs))
    print(f"  ✓ {path}")


def save_png(img: Image.Image, filename: str):
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path, format="PNG")
    print(f"  ✓ {path}")


def make_og_image():
    """Create a 1200×630 social preview image."""
    w, h = 1200, 630
    img = Image.new("RGBA", (w, h), hex_to_rgb(BG_COLOR))
    draw = ImageDraw.Draw(img)

    # Background gradient strips (decorative)
    for i in range(0, w, 40):
        alpha = max(0, 18 - i // 40)
        draw.rectangle([i, 0, i + 20, h], fill=(*hex_to_rgb("#1A6BFF"), alpha))

    # Large icon (centered-left)
    icon = draw_icon(200)
    img.paste(icon, (80, (h - 200) // 2), icon)

    # Text
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        sub_font   = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
    except Exception:
        title_font = sub_font = ImageFont.load_default()

    draw.text((320, 210), APP_NAME, fill=hex_to_rgb(TEXT_COLOR), font=title_font)
    draw.text((322, 310), TAGLINE,  fill=hex_to_rgb(ACCENT_COLOR), font=sub_font)

    path = os.path.join(OUTPUT_DIR, "og-image.png")
    img.save(path, format="PNG")
    print(f"  ✓ {path}")


# ─── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"\n🎨 Generating CareerIQ Pro icons into {OUTPUT_DIR}/\n")

    # Generate icons at all required sizes
    sizes      = [16, 32, 48, 64, 128, 180, 192, 512]
    icon_cache = {s: draw_icon(s) for s in sizes}

    # favicon.ico — 16, 32, 48
    save_ico(
        [(s, icon_cache[s]) for s in [16, 32, 48]],
        os.path.join(OUTPUT_DIR, "favicon.ico")
    )

    # PWA icons
    save_png(icon_cache[192], "logo192.png")
    save_png(icon_cache[512], "logo512.png")

    # Apple Touch Icon
    save_png(icon_cache[180], "apple-touch-icon.png")

    # OG image
    make_og_image()

    print("""
✅ Done! Place all generated files in:
   frontend/public/

Then update frontend/public/index.html <head>:
   <link rel="icon"             href="%PUBLIC_URL%/favicon.ico" />
   <link rel="apple-touch-icon" href="%PUBLIC_URL%/apple-touch-icon.png" />
   <meta property="og:image"   content="/og-image.png" />

To change the icon appearance, edit these lines at the top of this script:
   BRAND_INITIALS = "IQ"         ← text shown in icon
   BG_COLOR       = "#1A6BFF"    ← background color
   TEXT_COLOR     = "#FFFFFF"    ← text color
   ACCENT_COLOR   = "#AAFF00"    ← accent dot color
""")
