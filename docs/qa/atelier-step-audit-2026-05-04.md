# Atelier step image audit — 2026-05-04

Source: `docs/qa/atelier-step-contact-sheet.jpg`.

## Status
- Atelier step photos: 40/40 recipes covered.
- Step images in sheet: 154.
- Build gate: `npm run check:images` passes with 280 referenced images.

## Fixed during audit
- `cielęcina-czarny-czosnek-morelowa-skor` step 2: regenerated black garlic butter image; old one read as burnt/charcoal debris.
- `ryz-crispy-chili-ananas-shrimp` step 5: regenerated final plating; old one read muddy/unappetizing.
- `makaron-ryzowy-sezam-borowka` step 1: regenerated noodle prep; old crop was too empty/uninformative.

## Optional review later
- Item 6: `krewetki-yuzu-maslo-palona-cytryna`, step 3 — may read slightly empty/useless crop.
- Item 17: `kaczka-hoisin-sliwka-five-spice`, step 3 — resting duck step may be low-information.

No high-confidence blocker remains from the automated visual audit.
