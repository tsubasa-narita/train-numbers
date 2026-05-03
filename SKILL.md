---
name: train-numbers-project
description: Project-specific implementation rules for the train counting app.
---

# Train Numbers Project Rules

## Train Image Assets

- Every play-card train image referenced from `src/data/quizTrains.ts` must be a portrait asset.
- Required size: `384x512` pixels.
- Required aspect ratio: `3:4`.
- Store train images in `public/images/trains/`.
- When generating or editing train images, explicitly request or create a vertical portrait composition, not a landscape train photo.
- Do not fix a landscape train image by placing it on a portrait canvas, adding blurred padding, or pasting it into a frame. If an image is landscape or visually framed like a pasted photo, regenerate it from the prompt as a native vertical composition.
- Generated play-card images should show the train naturally in the scene, centered and fully visible, with no decorative border, no white photo frame, and no blurred background panel.
- After adding or replacing train images, run:

```powershell
npm run check:assets
```

This catches horizontal images before they are committed.

## Reward Card Assets

- Reward card art should feel richer than play-card art: bright border, prize-card treatment, stars or shine, and readable train name.
- Reward card files live in `public/images/ui/` and are referenced from `REWARD_CARDS` in `src/main.tsx`.
- Prefer portrait reward cards so they display well in the collection grid and modal.
