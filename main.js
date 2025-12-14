document.addEventListener('DOMContentLoaded', () => {
    const enterButton = document.getElementById('enter-button');
    const backgroundMusic = document.getElementById('background-music');

    backgroundMusic.pause();

    enterButton.addEventListener('click', () => {
        enterButton.style.display = 'none';
        backgroundMusic.play();
    }, { once: true });

    const toggleButton = document.getElementById('toggle-visibility-btn');
    let terrainVisible = true;
    toggleButton.addEventListener('click', () => {
        if (terrain && !isFading) {
            terrainVisible = !terrainVisible;
            isFading = true;
            if (terrainVisible) {
                terrain.visible = true;
            }
        }
    });
});

// Initialize Three.js scene
const scene = new THREE.Scene();

scene.fog = new THREE.Fog(0x000000, 100, 400); // Enhanced fog for smooth fadeout
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff); // White background
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container').appendChild(renderer.domElement);

// Add custom skybox with gradient and subtle fog
const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
        topColor: { value: new THREE.Color(0x808080) },
        bottomColor: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        
        void main() {
            // Create vertical gradient based on height
            float h = normalize(vWorldPosition).y * 0.5 + 0.5;
            vec3 color = mix(bottomColor, topColor, smoothstep(0.0, 1.0, h));
            
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    side: THREE.BackSide
});

const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// Custom Fresnel shader material for edge glow effect
function createFresnelMaterial(fresnelColor = new THREE.Color(0x00ffff), fresnelPower = 2.0, fresnelIntensity = 1.0) {
    const vertexShader = `
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            
            vNormal = normalize(normalMatrix * normal);
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            
            gl_Position = projectionMatrix * mvPosition;
        }
    `;
    
    const fragmentShader = `
        uniform vec3 fresnelColor;
        uniform float fresnelPower;
        uniform float fresnelIntensity;
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
            // Calculate Fresnel effect based on view direction and surface normal
            vec3 viewDirection = normalize(vViewPosition);
            vec3 normal = normalize(vNormal);
            
            // Fresnel factor: higher at grazing angles (edges)
            float fresnel = 1.0 - max(0.0, dot(normal, viewDirection));
            fresnel = pow(fresnel, fresnelPower) * fresnelIntensity;
            
            // Create the edge glow effect
            vec3 finalColor = mix(vec3(0.0), fresnelColor, fresnel);
            float finalAlpha = fresnel;
            
            gl_FragColor = vec4(finalColor, finalAlpha);
        }
    `;
    
    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            fresnelColor: { value: fresnelColor },
            fresnelPower: { value: fresnelPower },
            fresnelIntensity: { value: fresnelIntensity }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    return shaderMaterial;
}

// Add controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(0, 70, 0);
controls.target.set(0, 0, 0);
controls.update();


// Add enhanced lighting for better global illumination
// Ambient light for base illumination (increased for more consistent lighting)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

// Hemisphere light for natural sky/ground lighting (increased intensity)
const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 1.2);
scene.add(hemisphereLight);

// Main directional light (sun) - aimed between both models (increased intensity)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight.position.set(5, 25, 5);
directionalLight.lookAt(-7.5, 0, 7.5); // Looking at midpoint between terrain and volcano
scene.add(directionalLight);

// Additional fill light from opposite direction
const fillLight = new THREE.DirectionalLight(0xfff8dc, 1.0);
fillLight.position.set(-15, 20, -15);
fillLight.lookAt(-7.5, 0, 7.5); // Also aimed at midpoint
scene.add(fillLight);

// Secondary directional light for enhanced global illumination
const directionalLight2 = new THREE.DirectionalLight(0xfff4e6, 1.2);
directionalLight2.position.set(-10, 30, 10);
directionalLight2.lookAt(0, 0, 0); // Focused on volcano model area
scene.add(directionalLight2);

// Point lights for more even global illumination (positioned to cover both models)
const pointLight1 = new THREE.PointLight(0xffffff, 1.2, 150);
pointLight1.position.set(10, 20, 10); // Near volcano slice
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 1.2, 150);
pointLight2.position.set(-20, 20, 20); // Near terrain model
scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xffffff, 1.0, 150);
pointLight3.position.set(-5, 25, 15); // Additional light for terrain area
scene.add(pointLight3);

const pointLight4 = new THREE.PointLight(0xffffff, 1.0, 150);
pointLight4.position.set(5, 25, -5); // Additional light for volcano area
scene.add(pointLight4);

// Enhanced point lights specifically for volcano model global illumination
const volcanoPointLight1 = new THREE.PointLight(0xfff4e6, 1.5, 100);
volcanoPointLight1.position.set(8, 15, 8); // Warm light near volcano
scene.add(volcanoPointLight1);

const volcanoPointLight2 = new THREE.PointLight(0xffd700, 1.3, 100);
volcanoPointLight2.position.set(-8, 12, 8); // Golden warm light
scene.add(volcanoPointLight2);

const volcanoPointLight3 = new THREE.PointLight(0xfff4e6, 1.4, 100);
volcanoPointLight3.position.set(0, 18, -8); // Front warm light
scene.add(volcanoPointLight3);

const volcanoPointLight4 = new THREE.PointLight(0xffffff, 1.1, 100);
volcanoPointLight4.position.set(0, 25, 0); // Top light for better illumination
scene.add(volcanoPointLight4);

// Spotlight for dramatic accent lighting on volcano
const volcanoSpotLight = new THREE.SpotLight(0xfff4e6, 2.0, 200);
volcanoSpotLight.position.set(15, 30, 15);
volcanoSpotLight.angle = Math.PI / 6;
volcanoSpotLight.penumbra = 0.3;
volcanoSpotLight.decay = 2;
volcanoSpotLight.distance = 200;
volcanoSpotLight.target.position.set(0, 0, 0); // Focused on volcano
scene.add(volcanoSpotLight);
scene.add(volcanoSpotLight.target);



// GLTF Loader
const loader = new THREE.GLTFLoader();

// Variables for fade animation
let terrain = null;
let isFading = false;
let fadeSpeed = 0.02;


// Load terrain model (single instance)
loader.load('mayon_FULL3.glb', ({ scene: terrainModel }) => {
    terrainModel.position.set(0, 0.15, 0); // Separated position to avoid overlap
    terrainModel.scale.set(0.25, 0.25, 0.25);
    terrainModel.rotation.set(0, -135, 0);
    // Enable transparency for fade animation
    terrainModel.traverse((child) => {
        if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = 1.0;
            
            // Mark this mesh as processed to avoid infinite recursion
            child.userData.fresnelProcessed = true;
        }
    });
    
    // Apply Fresnel effect separately after traversal
    terrainModel.traverse((child) => {
        if (child.isMesh && !child.userData.fresnelProcessed) {
            child.userData.fresnelProcessed = true;
        }
    });
    
    terrainModel.traverse((child) => {
        if (child.isMesh && child.userData.fresnelProcessed && !child.userData.fresnelAdded) {
            // Apply Fresnel effect to terrain model
            const fresnelMaterial = createFresnelMaterial(
                new THREE.Color(0x00ffff), // Green color for terrain
                2.0, // Fresnel power
                1.0  // Fresnel intensity
            );
            
            // Clone the mesh for fresnel outline
            const fresnelMesh = child.clone();
            fresnelMesh.material = fresnelMaterial;
            fresnelMesh.scale.multiplyScalar(1.01); // Slightly larger for outline effect
            fresnelMesh.userData.fresnelOutline = true; // Mark as outline to avoid processing
            
            // Add to parent instead of child to avoid recursion
            child.parent.add(fresnelMesh);
            child.userData.fresnelAdded = true;
        }
    });
    
    scene.add(terrainModel);
    console.log(terrainModel);
    terrainModel.name = 'Terrain';
    terrain = terrainModel;
}, undefined, function (error) {
    console.error('An error happened loading terrain:', error);
});


// Load volcano slice model
let volcano;
loader.load('mayon_slice_FULL3.glb', function (gltf) {
    volcano = gltf.scene;
    volcano.position.set(0, 0, 0);
    volcano.scale.set(0.25, 0.25, 0.25); // Reverted scale back to original 0.25
    volcano.rotation.set(0,-135, 0);
    
    // Mark meshes as processed and apply Fresnel effect
    volcano.traverse((child) => {
        if (child.isMesh) {
            // Mark this mesh as processed to avoid infinite recursion
            child.userData.fresnelProcessed = true;
        }
    });
    
    // Apply Fresnel effect separately after traversal
    volcano.traverse((child) => {
        if (child.isMesh && child.userData.fresnelProcessed && !child.userData.fresnelAdded) {
            // Create Fresnel outline effect
            const fresnelMaterial = createFresnelMaterial(
                new THREE.Color(0x00ffff), // Cyan color for volcano
                2.5, // Fresnel power
                1.2  // Fresnel intensity
            );
            
            // Clone the mesh for fresnel outline
            const fresnelMesh = child.clone();
            fresnelMesh.material = fresnelMaterial;
            fresnelMesh.scale.multiplyScalar(1.02); // Slightly larger for outline effect
            fresnelMesh.userData.fresnelOutline = true; // Mark as outline to avoid processing
            
            // Add to parent instead of child to avoid recursion
            child.parent.add(fresnelMesh);
            child.userData.fresnelAdded = true;
        }
    });
    
    scene.add(volcano);
    console.log(volcano);
}, undefined, function (error) {
    console.error('An error happened loading volcano:', error);
});


// Animation loop
function animate() {
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

// Handle window resize
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
