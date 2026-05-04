from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import re, textwrap

root = Path(__file__).resolve().parents[1]
text = (root / 'src/lib/recipes.ts').read_text()
blocks = re.findall(r"\{\n    slug: '([^']+)',([\s\S]*?)\n  \},", text)
items = []
for slug, body in blocks:
    if "'atelier'" not in body or 'stepImages:' not in body:
        continue
    title = re.search(r"title: '((?:\\'|[^'])+)'", body)
    title = title.group(1).replace("\\'", "'") if title else slug
    steps_match = re.search(r"steps: \[([\s\S]*?)\n    \]", body)
    images_match = re.search(r"stepImages: \[([\s\S]*?)\n    \]", body)
    if not steps_match or not images_match:
        continue
    steps = [m.group(1).replace("\\'", "'") for m in re.finditer(r"'((?:\\'|[^'])+)'", steps_match.group(1))]
    images = [m.group(1) for m in re.finditer(r"'(/recipes/steps/[^']+)'", images_match.group(1))]
    for i, image in enumerate(images):
        items.append({
            'slug': slug,
            'title': title,
            'step': i + 1,
            'text': steps[i] if i < len(steps) else '',
            'image': image,
        })

out_dir = root / 'docs/qa'
out_dir.mkdir(parents=True, exist_ok=True)
out_path = out_dir / 'atelier-step-contact-sheet.jpg'

thumb_w, thumb_h = 260, 174
label_h = 112
cols = 4
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * thumb_w, rows * (thumb_h + label_h)), (255, 250, 243))
draw = ImageDraw.Draw(sheet)
try:
    title_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 13)
    meta_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 10)
except Exception:
    title_font = meta_font = None

for idx, item in enumerate(items):
    x = (idx % cols) * thumb_w
    y = (idx // cols) * (thumb_h + label_h)
    image_path = root / 'public' / item['image'].lstrip('/')
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
    draw.text((x + 9, y + thumb_h + 8), f"{idx + 1}. {item['slug']} · krok {item['step']}", fill=(138, 75, 42), font=meta_font)
    for n,line in enumerate(textwrap.wrap(item['title'], width=31)[:2]):
        draw.text((x + 9, y + thumb_h + 28 + n*16), line, fill=(32, 23, 20), font=title_font)
    for n,line in enumerate(textwrap.wrap(item['text'], width=36)[:2]):
        draw.text((x + 9, y + thumb_h + 64 + n*14), line, fill=(32, 23, 20), font=meta_font)

sheet.save(out_path, quality=88, optimize=True)
print(out_path)
print(f"Step images: {len(items)}")
