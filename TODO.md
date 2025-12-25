# TODO: Fix Texture Loading Issue

- [x] Modify createSmokeParticles() in smoke.js to preload both default and white smoke textures at startup, storing white ones in window.whiteSmokeTextures.
- [x] In updateSmoke(), set window.currentSmokeTextures based on window.isType1Eruption flag: use window.whiteSmokeTextures if true, else loadedTextures.
- [x] Remove loadWhiteSmokeTextures() call from type1_eruption() in eruption.js.
- [x] Ensure window.whiteSmokeTextures is initialized.
- [x] Remove async texture switching from loadWhiteSmokeTextures() since textures are preloaded.
