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
    const fadeStep = () => {
        if (!terrain) return;
        
        terrain.traverse((child) => {
            if (child.isMesh && child.material) {
                if (out) {
                    child.material.opacity -= fadeSpeed;
                    if (child.material.opacity <= 0) {
                        child.material.opacity = 0;
                        scene.remove(terrain);
                        terrain.visible = false;
                        camera.position.set(9, -24, 61);
                        camera.lookAt(volcano.position);
                    }
                } else {
                    child.material.opacity += fadeSpeed;
                    if (child.material.opacity >= 1) {
                        child.material.opacity = 1;
                        if (!scene.children.includes(terrain)) {
                            scene.add(terrain);
                            terrain.visible = true;
                            camera.position.set(15, 14, 25);
                            camera.lookAt(volcano.position);
                        }
                    }
                }
            }
        });
        
        if (out) {
            // Check if fully faded out
            let allTransparent = true;
            terrain.traverse((child) => {
                if (child.isMesh && child.material && child.material.opacity > 0) {
                    allTransparent = false;
                }
            });
            
            if (!allTransparent) {
                requestAnimationFrame(fadeStep);
            } else {
                isFading = false;
            }
        } else {
            // Check if fully visible
            let allOpaque = true;
            terrain.traverse((child) => {
                if (child.isMesh && child.material && child.material.opacity < 1) {
                    allOpaque = false;
                }
            });
            
            if (!allOpaque) {
                requestAnimationFrame(fadeStep);
            } else {
                isFading = false;
            }
        }
    };
    
    fadeStep();
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
