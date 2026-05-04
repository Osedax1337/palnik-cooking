from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
subprocess.run([
    'python3',
    str(root / 'scripts/make-recipe-contact-sheet.py'),
    '--collection', 'atelier',
    '--output', 'docs/qa/atelier-contact-sheet.jpg',
], check=True)
