# Design QA — 波形の基準状態

## Comparison target

- Source visual truth: `C:\Users\beefs\AppData\Local\Temp\codex-clipboard-51b19b5a-e6e6-47ce-a17b-3eec07a7f9e9.png`
- Implementation: in-app browser capture of `http://127.0.0.1:5175/digital-business-card/` captured in this task after the change.
- State: profile initial state (no page transition in progress).
- Source dimensions: 368 × 407 px. The comparison used the card-content region only; the source contains a surrounding design canvas while the implementation capture includes the app navigation.
- Implementation capture: 653 × 553 px, with the card content rendered at the same 2:3 ratio. The in-app-browser screenshot is retained in the task conversation rather than as a workspace file.

## Comparison evidence

- Full view: the initial implementation retains the deep blue upper field, the large concave white edge below it, the large convex white edge above the bottom field, and the blue paper texture shown by the source.
- Focused wave regions: the upper curve reaches its low point near the center-right and the lower curve rises near the center, matching the source's intentionally asymmetric Figma-derived silhouette. The second wave is absent in the initial state, so it cannot change the approved baseline shape.
- Transition verification: during an active page switch, two SVG wave layers are present; on completion the secondary layer is removed and both layers return to the base position. This passed in mobile Chromium, Firefox, and WebKit.

## Required fidelity surfaces

- Fonts and typography: out of scope for this wave-only change; the existing title, profile copy, and navigation text remain unchanged.
- Spacing and layout rhythm: card ratio, page layout, and navigation remain unchanged; the wave components retain their existing height and attachment points.
- Colors and visual tokens: the existing blue paper texture and white paper surface are reused. The transition-only second wave is 26% opacity.
- Image quality and asset fidelity: existing title, illustration, paper texture, and blue texture assets are preserved; no replacement assets were introduced.
- Copy and content: unchanged.

## Findings

No actionable P0, P1, or P2 differences for the requested initial-wave restoration.

## Comparison history

1. The reference-SVG prototype used a regular repeated wave and did not preserve the source's asymmetric initial silhouette. It was replaced with the original Figma-derived base paths.
2. The revised capture restores the source-shaped upper and lower waves. The second wave renders only while a navigation transition is active.
3. The transition was then shortened and its two layers given a greater phase offset to make the requested undulation clearer; the initial state remains unchanged.
4. The active wave layers were given stronger vertical volume changes and both the SVG and the card were clipped to prevent boundary overflow.

## Implementation checklist

1. Preserve Figma-derived base paths for the idle state. Complete.
2. Render a delayed, translucent second layer only for active transitions. Complete.
3. Verify initial and active states across the supported mobile browser projects. Complete.

final result: passed
