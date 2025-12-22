# TODO for Adding Fade Effects to shakeCamera

- [x] Modify shakeCamera function in eruption.js to add fade-in effect for the new texture: Set initial opacity to 0 when texture loads, then gradually increase to 1 during shake duration.
- [x] Add gradual color change for fresnel shader: Interpolate fresnelColor from cyan (0x00ffff) to red (0xff0000) based on shake progress.
- [x] Ensure effects are synchronized with the existing shake animation.
- [x] Fix fade-in and texture override to happen only once when shakeCamera is called, not with every shake loop.
- [x] Test the animation to ensure fade-in and color change work smoothly.
- [x] Verify that the effects trigger correctly when the eruption button is clicked.
