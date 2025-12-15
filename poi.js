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
    const intersects = raycaster.intersectObjects(volcano.children, true);
    if (intersects.length > 0) {
        const infoboxDiv = document.getElementById('infobox');
        if (infoboxDiv.textContent.includes('BACK')) {
            // Fade terrain back in
            
            infoboxDiv.textContent = 'empty';
            console.log('Infobox updated to: empty');
        } else {
            const intersects = raycaster.intersectObjects(volcano.children, true);
            if (intersects.length > 0) {
                infoboxDiv.textContent = 'volcano BACK';
                console.log('Infobox updated to: volcano BACK');
                // Fade terrain out
                
            }
        }
    }
}

function toggleInfobox() {
    const infoboxElement = document.getElementById('infobox');
    const isBackPressed = infoboxElement.textContent.includes('BACK');

    if (isBackPressed) {
        // Fade terrain back in
        
        infoboxElement.textContent = '';
    } else {
        const intersects = raycaster.intersectObjects(volcano.children, true);
        if (intersects.length > 0) {
            infoboxElement.textContent = 'Volcano BACK';
            // Fade terrain out
            
        }
    }
}

function toggleAudio() {
    const backgroundMusic = document.getElementById('background-music');
    if (backgroundMusic.paused) {
        backgroundMusic.volume = 0.5;
        backgroundMusic.playbackRate = 0.75;
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
