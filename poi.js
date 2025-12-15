const redCubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const redCubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const redCube = new THREE.Mesh(redCubeGeometry, redCubeMaterial);
redCube.userData.isRedCube = true;
redCube.userData.isGlowing = false;

// Position the red cube in front of the slice model
redCube.position.set(-4, -3, 5);

scene.add(redCube);

// Animation loop
function animate(terrainVisible) {
    requestAnimationFrame(animate);

    if (isFading && terrain) {
        if (!terrainVisible) { // Fading out
            let stillFading = false;
            terrain.traverse((child) => {
                if (child.isMesh && child.material.opacity > 0) {
                    child.material.opacity -= fadeSpeed;
                    if(child.material.opacity < 0) child.material.opacity = 0;
                    stillFading = true;
                }
            });

            // A bit of a hack to check if any mesh is still visible
            let anyMeshVisible = false;
            terrain.traverse((child) => {
                if (child.isMesh && child.material.opacity > 0) {
                    anyMeshVisible = true;
                }
            });

            if (!anyMeshVisible) {
                 isFading = false;
                 terrain.visible = false;
            }

        } else { // Fading in
            let stillFading = false;
             terrain.traverse((child) => {
                if (child.isMesh && child.material.opacity < 1) {
                    child.material.opacity += fadeSpeed;
                    if(child.material.opacity > 1) child.material.opacity = 1;
                    stillFading = true;
                }
            });

            // A bit of a hack to check if any mesh is still invisible
            let anyMeshInvisible = false;
            terrain.traverse((child) => {
                if (child.isMesh && child.material.opacity < 1) {
                    anyMeshInvisible = true;
                }
            });

            if (!anyMeshInvisible) {
                 isFading = false;
            }
        }
    }

    // Only update controls if the user is interacting with the scene
    if (controls.enabled) {
        controls.update();
    }

    renderer.render(scene, camera);

    // Only update the camera coordinates display if the camera has moved
    const coordsDiv = document.getElementById('coordinates');
    const prevCoordsText = coordsDiv.textContent;
    const coordsText = `Camera: X: ${camera.position.x.toFixed(2)}, Y: ${camera.position.y.toFixed(2)}, Z: ${camera.position.z.toFixed(2)}`;
    if (coordsText !== prevCoordsText) {
        coordsDiv.textContent = coordsText;
    }
}
animate();
// Fade animation function
function fadeTerrain(out) {
    if (!terrain || isFading) return;

    isFading = true;

    const startPosition = camera.position.clone();
    const endPosition = out ? new THREE.Vector3(9, -24, 61) : new THREE.Vector3(15, 14, 25);
    
    // Ensure terrain is visible and set initial opacity for fade-in
    if (!out) {
        terrain.traverse(child => {
            if(child.isMesh) {
                // Ensure material is transparent to allow fading
                child.material.transparent = true;
                child.material.opacity = 0;
            }
        });
        if (!scene.children.includes(terrain)) {
            scene.add(terrain);
        }
        terrain.visible = true;
    }

    const duration = 1500; // 1.5 seconds for the animation
    let startTime = null;

    function animationStep(timestamp) {
        if (startTime === null) {
            startTime = timestamp;
        }
        const elapsedTime = timestamp - startTime;
        const linearProgress = Math.min(elapsedTime / duration, 1);
        // Apply ease-in-out function for smoother animation
        const easedProgress = 0.5 * (1 - Math.cos(linearProgress * Math.PI));

        // Interpolate camera position and update its view
        camera.position.lerpVectors(startPosition, endPosition, easedProgress);
        if(volcano) camera.lookAt(volcano.position);

        // Interpolate terrain opacity
        const opacity = out ? 1 - easedProgress : easedProgress;
        terrain.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.opacity = opacity;
            }
        });

        if (linearProgress < 1) {
            requestAnimationFrame(animationStep);
        } else {
            // Animation complete
            isFading = false;
            if (out) {
                terrain.visible = false;
                scene.remove(terrain);
            }
        }
    }

    requestAnimationFrame(animationStep);
}


// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    const redCubeIntersect = intersects.find(intersect => intersect.object.userData.isRedCube);

    if (redCubeIntersect) {
        const infoboxDiv = document.getElementById('infobox');
        if (redCube.userData.isGlowing) {
            redCube.material.color.setHex(0xff0000); // Back to normal red
            redCube.userData.isGlowing = false;
            infoboxDiv.textContent = 'Infobox CLOSED';
            console.log('Infobox updated to: CLOSED');
        } else {
            redCube.material.color.setHex(0xffb3b3); // Brighter red
            redCube.userData.isGlowing = true;
            infoboxDiv.textContent = 'Infobox OPEN';
            console.log('Infobox updated to: empty');
        }
    }
}

function toggleAudio() {
    const backgroundMusic = document.getElementById('background-music');
    if (!backgroundMusic) {
        console.error("Audio element with id 'background-music' not found.");
        return;
    }
    // Set properties each time to ensure they are applied
    backgroundMusic.volume = 0.05;
    backgroundMusic.playbackRate = 0.75;

    if (backgroundMusic.paused) {
        backgroundMusic.play();
    } else {
        backgroundMusic.pause();
    }
}

window.addEventListener('click', onMouseClick);
document.getElementById('toggle-visibility-btn').addEventListener('click', () => {
    if (terrain) {
        fadeTerrain(terrain.visible);
    }
});
