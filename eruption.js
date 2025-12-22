// Function to shake the camera with looping, varying speed and intensity, and uneven intervals
window.shakeCamera = function() {
    // Override texture of mayon_FULL3.glb with volcano_erupted_tex.png
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('volcano_erupted_tex.png', (texture) => {
        texture.encoding = THREE.sRGBEncoding; // Ensure correct color space
        if (window.terrain) {
            window.terrain.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.map = texture;
                    child.material.opacity = 0; // Start with opacity 0 for fade-in
                    child.material.needsUpdate = true;
                }
            });
        }
    });

    // Collect fresnel materials for color interpolation
    let fresnelMaterials = [];
    const originalFresnelColor = new THREE.Color(0x00ffff); // Original cyan color
    if (window.terrain) {
        window.terrain.traverse((child) => {
            if (child.userData.fresnelOutline && child.material.uniforms && child.material.uniforms.fresnelColor) {
                fresnelMaterials.push(child.material);
            }
        });
    }
    if (window.volcano) {
        window.volcano.traverse((child) => {
            if (child.userData.fresnelOutline && child.material.uniforms && child.material.uniforms.fresnelColor) {
                fresnelMaterials.push(child.material);
            }
        });
    }

    const targetPosition = new THREE.Vector3(19, 14, 24);
    let isShaking = false;
    let shakeStartTime = 0;
    let shakeDuration = 0;
    let shakeIntensity = 0;
    let nextShakeTime = Date.now();
    let hasMovedToTarget = false;
    let hasTextureFadedIn = false;
    let hasColorChanged = false;

    function animateShake() {
        const currentTime = Date.now();

        if (!isShaking && currentTime >= nextShakeTime) {
            // Start a new shake
            isShaking = true;
            shakeStartTime = currentTime;
            shakeDuration = Math.random() * 3000 + 2000; // 2-5 seconds
            shakeIntensity = Math.random() * 0.4 + 0.1; // 0.1-0.5
        }

        if (isShaking) {
            const elapsed = currentTime - shakeStartTime;
            const progress = elapsed / shakeDuration;

            if (progress < 1) {
                // Calculate fade factor for fade-in and fade-out effect
                const fadeFactor = Math.sin(progress * Math.PI);

                // Fade in the new texture opacity (only on first shake)
                if (!hasTextureFadedIn && window.terrain) {
                    window.terrain.traverse((child) => {
                        if (child.isMesh && child.material && child.material.map) {
                            child.material.opacity = progress; // Gradually increase opacity from 0 to 1
                            child.material.needsUpdate = true;
                        }
                    });
                }

                // Gradually change fresnel color from cyan to red (only on first shake)
                if (!hasColorChanged) {
                    const targetFresnelColor = new THREE.Color(0xff0000); // Red color
                    const currentFresnelColor = new THREE.Color();
                    currentFresnelColor.lerpColors(originalFresnelColor, targetFresnelColor, progress);
                    fresnelMaterials.forEach(material => {
                        material.uniforms.fresnelColor.value.copy(currentFresnelColor);
                    });
                }

                // Generate random offsets for shake, multiplied by fade factor (reduced intensity for slower shake)
                const offsetX = (Math.random() - 0.5) * shakeIntensity * fadeFactor * 0.5;
                const offsetY = (Math.random() - 0.5) * shakeIntensity * fadeFactor * 0.5;
                const offsetZ = (Math.random() - 0.5) * shakeIntensity * fadeFactor * 0.5;

                if (!hasMovedToTarget) {
                    // First shake: interpolate position from original to target
                    const originalPosition = window.camera.position.clone();
                    const lerpedPosition = new THREE.Vector3();
                    lerpedPosition.lerpVectors(originalPosition, targetPosition, progress);

                    window.camera.position.set(
                        lerpedPosition.x + offsetX,
                        lerpedPosition.y + offsetY,
                        lerpedPosition.z + offsetZ
                    );
                } else {
                    // Subsequent shakes: shake around target position
                    window.camera.position.set(
                        targetPosition.x + offsetX,
                        targetPosition.y + offsetY,
                        targetPosition.z + offsetZ
                    );
                }

                requestAnimationFrame(animateShake);
            } else {
                // End of shake
                isShaking = false;
                // Always reset to target position after shake
                window.camera.position.copy(targetPosition);
                if (!hasMovedToTarget) {
                    hasMovedToTarget = true;
                    hasTextureFadedIn = true;
                    hasColorChanged = true;
                }
                // Set next shake time with random delay (3-10 seconds)
                nextShakeTime = currentTime + Math.random() * 7000 + 3000;
                requestAnimationFrame(animateShake);
            }
        } else {
            // Not shaking, continue looping
            requestAnimationFrame(animateShake);
        }
    }

    animateShake();
};

// Add event listener for the trigger eruption button
document.addEventListener('DOMContentLoaded', () => {
    const triggerEruptionBtn = document.getElementById('trigger-eruption-btn');
    if (triggerEruptionBtn) {
        triggerEruptionBtn.addEventListener('click', () => {
            window.shakeCamera();
        });
    }
});
