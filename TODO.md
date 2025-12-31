# TODO: Implement Camera Reset on Inside Volcano Button Toggle

## Completed Steps
- [x] Add `window.isAnimatingCamera` flag to track camera animation state
- [x] Create `animateCameraToDefault()` function to animate camera to default position (15, 14, 25) with lookAt (0, 0, 0)
- [x] Update animation loop in main.js to prevent controls update during camera animation
- [x] Modify button click handler in poi.js to call `animateCameraToDefault()` when going outside (isInsideView true)

## Followup Steps
- [ ] Test the button toggle to ensure camera resets to default when going outside
- [ ] Verify no conflicts with existing animations (fadeTerrain, fadeVolcano)
- [ ] Check that controls are properly restored after animation
- [ ] Ensure isInsideView state is correctly updated
