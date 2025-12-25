window.gasDensity = 30; // Default gas density (50% of 10-50)
window.volcanoStretch = 2.0; // Default volcano stretch (50% of 1.0-3.0)
window.temperature = 10; // Default temperature (50% of 0-20)
window.smokeSpeed = 0.01; // Default smoke speed
window.smokeHeight = 1.0; // Default smoke height
window.smokeLifetime = 2.5; // Default smoke lifetime

const parametersButton = document.getElementById('parameters-btn');
const popup = document.getElementById('parameters-popup');

if (parametersButton && popup) {
    parametersButton.addEventListener('click', () => {
        if (popup.style.display === 'none') {
            popup.style.display = 'block';
        } else {
            popup.style.display = 'none';
        }
    });
}

const smokeSpeedSlider = document.getElementById('smoke-speed-slider');
if (smokeSpeedSlider) {
    smokeSpeedSlider.addEventListener('input', (event) => {
        window.smokeSpeed = parseFloat(event.target.value);
    });
}

const smokeHeightSlider = document.getElementById('smoke-height-slider');
if (smokeHeightSlider) {
    smokeHeightSlider.addEventListener('input', (event) => {
        window.smokeHeight = parseFloat(event.target.value);
    });
}

const smokeLifetimeSlider = document.getElementById('smoke-lifetime-slider');
if (smokeLifetimeSlider) {
    smokeLifetimeSlider.addEventListener('input', (event) => {
        window.smokeLifetime = parseFloat(event.target.value);
    });
}

const gasDensitySlider = document.getElementById('gas-density-slider');
if (gasDensitySlider) {
    gasDensitySlider.addEventListener('input', (event) => {
        window.gasDensity = parseInt(event.target.value);
        if (window.updateTriggerButtonText) window.updateTriggerButtonText();
    });
}

const volcanoStretchSlider = document.getElementById('volcano-stretch-slider');
if (volcanoStretchSlider) {
    volcanoStretchSlider.addEventListener('input', (event) => {
        window.volcanoStretch = parseFloat(event.target.value);
        stretchVolcano();
        if (window.updateTriggerButtonText) window.updateTriggerButtonText();
    });
}

const temperatureSlider = document.getElementById('temperature-slider');
if (temperatureSlider) {
    temperatureSlider.addEventListener('input', (event) => {
        window.temperature = parseFloat(event.target.value);
        if (window.updateTriggerButtonText) window.updateTriggerButtonText();
    });
}

function stretchVolcano() {
    if (!window.volcano) {
        return;
    }

    const stretchSliderValue = window.volcanoStretch || 1.0;
    
    // Set smoke depth factor based on volcano stretch.
    // Deeper volcano (higher stretch value) means smaller factor, hence less vertical force for smoke.
    // window.smokeDepthFactor = 1.0 / stretchSliderValue; // Removed: Logic moved to smoke.js

    window.volcano.traverse((child) => {
        if (child.isMesh) {
            const geometry = child.geometry;
            if (geometry.isBufferGeometry && geometry.userData.originalVertices) {
                const positions = geometry.attributes.position.array;
                const originalPositions = geometry.userData.originalVertices;
                const stretchAmount = stretchSliderValue - 1.0;
                const maxDisplacement = 30; 

                const stretchMin = 90;
                const stretchMax = 35;

                for (let i = 0; i < originalPositions.length; i += 3) {
                    const originalX = originalPositions[i];
                    const originalY = originalPositions[i + 1];
                    const originalZ = originalPositions[i + 2];

                    // Reset positions to original state before applying transformation
                    positions[i] = originalX;
                    positions[i + 1] = originalY;
                    positions[i + 2] = originalZ;

                    let t = 0;
                    if (originalZ >= stretchMax) {
                        // Vertices above the stretch max are fully displaced.
                        t = 1;
                    } else if (originalZ >= stretchMin) {

                    // if (originalZ > stretchMin && originalZ <= stretchMax) {
                        // Vertices inside the stretch range are displaced proportionally.
                        t = (originalZ - stretchMin) / (stretchMax - stretchMin);
                    }
                    
                    // Apply displacement to stretch the model along the Z-axis
                    if (t > 0) {
                        const displacement = t * stretchAmount * maxDisplacement;
                        positions[i + 2] += displacement;
                    }
                }
                geometry.attributes.position.needsUpdate = true;
            }
        }
    });
}
