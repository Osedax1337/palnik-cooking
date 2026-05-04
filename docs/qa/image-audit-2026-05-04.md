# Palnik image audit — 2026-05-04

Source: `docs/qa/all-recipes-contact-sheet.jpg` generated from 126 recipe images.

## Fix applied
- `Soupe à l'oignon` looked broken on the contact sheet because the QA generator did not handle escaped apostrophes in TS strings. Fixed generator parsing and regenerated sheets.

## Human review queue
1. `pho-kokos-kolendra-limonka` — medium confidence mismatch
   - Title says coconut pho broth, image reads dark/clear broth.
   - Fix direction: replace with creamier/coconut-looking pho image or adjust recipe/title.

2. `bigos-szybki` — medium confidence mismatch
   - Image may look too light/thin for bigos.
   - Fix direction: review against recipe intent; replace with darker cabbage/meat stew if needed.

3. `tost-grzyby-ricotta` vs `tost-kurki-ricotta` — low confidence visual redundancy
   - Both look like very similar mushroom-toast cards.
   - Fix direction: optional style/crop variation so catalog scan feels less duplicated.

4. `makaron-ryzowy-z-sezamem-borowka-tamari` — low confidence recipe logic check
   - Image appears to match, but combination is unusual.
   - Fix direction: verify this is intentional, not data/image hallucination.

## Current status
- No missing image refs: `npm run check:images` passes.
- Full sheet: `docs/qa/all-recipes-contact-sheet.jpg`.
- Atelier sheet: `docs/qa/atelier-contact-sheet.jpg`.
