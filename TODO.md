# TODO: Implement Type 3 Eruption Adjustments

## Tasks
- [x] Update `type3_eruption()` in `eruption.js` to set smoke parameters: temperature=11 (medium), gasDensity=45 (high), volcanoStretch=1.8 (low-medium), and set `window.isType3Eruption = true`
- [x] Increase ash particle pool in `ash.js` from 5 to 50 particles
- [x] Add new condition in `updateAsh()` for type 3 eruptions: 10% chance per frame to create ash particles with longer lifetimes (1.0-1.5 seconds)
