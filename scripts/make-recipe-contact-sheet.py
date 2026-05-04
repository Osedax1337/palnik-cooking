from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import argparse, re, textwrap

parser = argparse.ArgumentParser(description='Generate Palnik recipe image contact sheets.')
parser.add_argument('--collection', default='all', help='Recipe collection to include, or all')
parser.add_argument('--output', default=None, help='Output JPG path')
args = parser.parse_args()

root = Path(__file__).resolve().parents[1]
text = (root / 'src/lib/recipes.ts').read_text()
blocks = re.split(r'\n  \{\n', text)[1:]
items = []
for block in blocks:
    if args.collection != 'all' and f"'{args.collection}'" not in block:
        continue

    def get(pattern):
        match = re.search(pattern, block, re.S)
        return match.group(1) if match else ''

    items.append({
        'slug': get(r"slug: '([^']+)'"),
        'title': get(r"title: '([^']+)'"),
        'image': get(r"image: '/recipes/([^']+)'"),
        'collections': get(r"collections: \[([^\]]+)\]"),
    })

out_dir = root / 'docs/qa'
out_dir.mkdir(parents=True, exist_ok=True)
out_path = Path(args.output) if args.output else out_dir / (f"{args.collection}-contact-sheet.jpg" if args.collection != 'all' else 'all-recipes-contact-sheet.jpg')
if not out_path.is_absolute():
    out_path = root / out_path
out_path.parent.mkdir(parents=True, exist_ok=True)

thumb_w, thumb_h = 300, 200
label_h = 90
cols = 4
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * thumb_w, rows * (thumb_h + label_h)), (255, 250, 243))
draw = ImageDraw.Draw(sheet)
try:
    title_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    meta_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
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
    draw.text((x + 10, y + thumb_h + 9), f"{idx + 1}. {item['slug']}", fill=(138, 75, 42), font=meta_font)
    for line_no, line in enumerate(textwrap.wrap(item['title'], width=29)[:2]):
        draw.text((x + 10, y + thumb_h + 31 + line_no * 20), line, fill=(32, 23, 20), font=title_font)

sheet.save(out_path, quality=88, optimize=True)
print(out_path)
print(f"Recipes: {len(items)}")
