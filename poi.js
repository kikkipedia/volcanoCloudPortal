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

window.addEventListener('click', onMouseClick);
document.getElementById('toggle-visibility-btn').addEventListener('click', () => {
    if (terrain) {
        fadeTerrain(terrain.visible);
    }
});
