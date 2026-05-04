from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import re, textwrap

root = Path(__file__).resolve().parents[1]
text = (root / 'src/lib/recipes.ts').read_text()
blocks = re.split(r'\n  \{\n', text)[1:]
items = []
for block in blocks:
    if "'atelier'" not in block:
        continue
    def get(pattern):
        match = re.search(pattern, block, re.S)
        return match.group(1) if match else ''
    items.append({
        'slug': get(r"slug: '([^']+)'"),
        'title': get(r"title: '([^']+)'"),
        'image': get(r"image: '/recipes/([^']+)'"),
    })

out_dir = root / 'docs/qa'
out_dir.mkdir(parents=True, exist_ok=True)
out_path = out_dir / 'atelier-contact-sheet.jpg'

thumb_w, thumb_h = 360, 240
label_h = 92
cols = 4
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * thumb_w, rows * (thumb_h + label_h)), (255, 250, 243))
draw = ImageDraw.Draw(sheet)
try:
    title_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17)
    meta_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
except Exception:
    title_font = meta_font = None

for idx, item in enumerate(items):
    x = (idx % cols) * thumb_w
    y = (idx // cols) * (thumb_h + label_h)
    image_path = root / 'public/recipes' / item['image']

    bg = Image.new('RGB', (thumb_w, thumb_h), (32, 23, 20))
    if image_path.exists():
        im = Image.open(image_path).convert('RGB')
        scale = max(thumb_w / im.width, thumb_h / im.height)
        size = (round(im.width * scale), round(im.height * scale))
        im = im.resize(size, Image.Resampling.LANCZOS)
        left = (im.width - thumb_w) // 2
        top = (im.height - thumb_h) // 2
        bg = im.crop((left, top, left + thumb_w, top + thumb_h))
    sheet.paste(bg, (x, y))

    draw.rectangle([x, y + thumb_h, x + thumb_w, y + thumb_h + label_h], fill=(255, 250, 243))
    draw.rectangle([x, y, x + thumb_w - 1, y + thumb_h + label_h - 1], outline=(224, 214, 202))
    draw.text((x + 12, y + thumb_h + 10), f"{idx + 1}. {item['slug']}", fill=(138, 75, 42), font=meta_font)
    for line_no, line in enumerate(textwrap.wrap(item['title'], width=34)[:2]):
        draw.text((x + 12, y + thumb_h + 34 + line_no * 22), line, fill=(32, 23, 20), font=title_font)

sheet.save(out_path, quality=88)
print(out_path)
print(f"Atelier recipes: {len(items)}")
