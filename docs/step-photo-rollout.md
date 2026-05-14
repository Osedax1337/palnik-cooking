# Step-photo rollout

Goal: give every Palnik recipe Atelier-like step visuals without turning the project into one giant untracked image swamp.

## Current rule

- Recipe hero/gallery images live under `public/recipes/`.
- Step images live under `public/recipes/steps/`.
- Recipe data uses `stepImages?: string[]` in `src/lib/recipes.ts`.
- `stepImages[0]` should describe `steps[0]`, `stepImages[1]` should describe `steps[1]`, etc.
- Store new assets as `.webp`, not PNG. Target ~1280px wide max, quality around 82.

## Batch order

1. Quick-flow winners first: recipes most likely to appear from “Mam X minut + składniki”.
2. Daily-use recipes next: `15-min`, `po-pracy`, `one-pan`, `lunchbox`.
3. Long-tail catalog after that.

## QA checklist for each batch

1. Add files as `/recipes/steps/{slug}-step-{n}.webp`.
2. Add matching `stepImages` entries in `src/lib/recipes.ts`.
3. Run:
   - `npm run qa:step-photos`
   - `npm run lint`
   - `npm run build`
4. Open at least one recipe from the batch on desktop and mobile.
5. Confirm mobile still does not get buried under huge step-photo content.

## Why this matters

Step photos are not just decoration. They should reduce cooking anxiety: “am I doing this right?” If a photo does not clarify texture, color, cut size, pan state, or final assembly, it is probably noise.
