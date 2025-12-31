document.addEventListener('DOMContentLoaded', () => {
    const backgroundMusic = document.getElementById('background-music');
    const enterButton = document.getElementById('enter-button');
    const refreshBtn = document.getElementById('refresh-btn');
    const toggleCameraBtn = document.getElementById('toggle-camera-btn');

    if (backgroundMusic) {
        backgroundMusic.pause();
    }

    if (enterButton) {
        enterButton.addEventListener('click', () => {
            toggleAudio();
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            location.reload();
        });
    }

    if (toggleCameraBtn) {
        toggleCameraBtn.addEventListener('click', () => {
            toggleCameraControls();
        });
    }
});

function toggleAudio() {
    const backgroundMusic = document.getElementById('background-music');
    const enterButton = document.getElementById('enter-button');
    if (!backgroundMusic) {
        console.error("Audio element with id 'background-music' not found.");
        return;
    }
    // Set properties each time to ensure they are applied
    backgroundMusic.volume = 0.05;
    backgroundMusic.playbackRate = 0.75;

    if (backgroundMusic.paused) {
        backgroundMusic.play();
        if(enterButton) enterButton.textContent = 'Audio Off';
    } else {
        backgroundMusic.pause();
        if(enterButton) enterButton.textContent = 'Audio On';
    }
}

// Function to toggle camera controls (re-introduced)
function toggleCameraControls() {
    if (window.controls) {
        window.controls.enabled = !window.controls.enabled;
        const button = document.getElementById('toggle-camera-btn');
        if (window.controls.enabled) {
            // Apply specified limits when controls are enabled
            window.controls.minPolarAngle = Math.PI / 3; // 60 degrees (from top)
            window.controls.maxPolarAngle = 2 * Math.PI / 3; // 120 degrees (from top)
            window.controls.minAzimuthAngle = -Infinity; // Keep full horizontal rotation
            window.controls.maxAzimuthAngle = Infinity; // Keep full horizontal rotation
            window.controls.enablePan = true; // Enable pan when controls are on
            button.textContent = 'Camera Control On';
        } else {
            // Reset limits and disable pan when controls are off
            window.controls.minPolarAngle = 0; // Full range
            window.controls.maxPolarAngle = Math.PI; // Full range
            window.controls.minAzimuthAngle = -Infinity; // Full range
            window.controls.maxAzimuthAngle = Infinity; // Full range
            window.controls.enablePan = false; // Disable pan when controls are off
            button.textContent = 'Camera Control Off';
        }
        console.log('Camera controls ' + (window.controls.enabled ? 'enabled' : 'disabled'));
    }
}


// Initialize Three.js scene
window.scene = new THREE.Scene();

window.scene.fog = new THREE.Fog(0x000000, 100, 400); // Enhanced fog for smooth fadeout
window.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
window.scene.add(sky);

createSmokeParticles();
createAshParticles();

// Custom Fresnel shader material for edge glow effect
function createFresnelMaterial(fresnelColor = new THREE.Color(0x00ffff), fresnelPower = 2.0, fresnelIntensity = 1.0) {
    const vertexShader = `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        precision mediump float;
        uniform vec3 fresnelColor;
        uniform float fresnelPower;
        uniform float fresnelIntensity;

        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
            // Calculate Fresnel effect
            vec3 viewDirection = normalize(vViewPosition);
            vec3 normal = normalize(vNormal);
            float fresnel = 1.0 - max(0.0, dot(normal, viewDirection));
            fresnel = pow(fresnel, fresnelPower);

            // Modulate intensity based on camera distance
            float cameraDistance = length(vViewPosition); // Corrected: use vViewPosition for distance from camera
            float distanceFactor = clamp(cameraDistance / 50.0, 0.1, 1.0);

            // Use smoothstep for a blurred transition
            float alpha = smoothstep(0.1, 0.7, fresnel) * fresnelIntensity * distanceFactor;

            gl_FragColor = vec4(fresnelColor.rgb, alpha); // Corrected: use fresnelColor and alpha
        }
    `;

    const uniforms = {
        fresnelColor: { value: fresnelColor },
        fresnelPower: { value: fresnelPower },
        fresnelIntensity: { value: fresnelIntensity }
    };

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        depthWrite: false
    });

    return shaderMaterial;
}

// Add controls
window.controls = new THREE.OrbitControls(window.camera, renderer.domElement);
window.controls.enabled = false; // Default to off
window.camera.position.set(15, 14, 25);
window.camera.lookAt(0, 0, 0);
window.controls.update();


// Add enhanced lighting for better global illumination
// Ambient light for base illumination (increased for more consistent lighting)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
window.scene.add(ambientLight);

// Hemisphere light for natural sky/ground lighting (increased intensity)
const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 1.2);
window.scene.add(hemisphereLight);

// Main directional light (sun) - aimed between both models (increased intensity)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight.position.set(5, 25, 5);
directionalLight.lookAt(-7.5, 0, 7.5); // Looking at midpoint between terrain and volcano
window.scene.add(directionalLight);

// Additional fill light from opposite direction
const fillLight = new THREE.DirectionalLight(0xfff8dc, 1.0);
fillLight.position.set(-15, 20, -15);
fillLight.lookAt(-7.5, 0, 7.5); // Also aimed at midpoint
window.scene.add(fillLight);

// Secondary directional light for enhanced global illumination
const directionalLight2 = new THREE.DirectionalLight(0xfff4e6, 1.2);
directionalLight2.position.set(-10, 30, 10);
directionalLight2.lookAt(0, 0, 0); // Focused on volcano model area
window.scene.add(directionalLight2);

// Point lights for more even global illumination (positioned to cover both models)
const pointLight1 = new THREE.PointLight(0xffffff, 1.2, 150);
pointLight1.position.set(10, 20, 10); // Near volcano slice
window.scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xffffff, 1.2, 150);
pointLight2.position.set(-20, 20, 20); // Near terrain model
window.scene.add(pointLight2);

const pointLight3 = new THREE.PointLight(0xffffff, 1.0, 150);
pointLight3.position.set(-5, 25, 15); // Additional light for terrain area
window.scene.add(pointLight3);

const pointLight4 = new THREE.PointLight(0xffffff, 1.0, 150);
pointLight4.position.set(5, 25, -5); // Additional light for volcano area
window.scene.add(pointLight4);

// Enhanced point lights specifically for volcano model global illumination
const volcanoPointLight1 = new THREE.PointLight(0xfff4e6, 1.5, 100);
volcanoPointLight1.position.set(8, 15, 8); // Warm light near volcano
window.scene.add(volcanoPointLight1);

const volcanoPointLight2 = new THREE.PointLight(0xffd700, 1.3, 100);
volcanoPointLight2.position.set(-8, 12, 8); // Golden warm light
window.scene.add(volcanoPointLight2);

const volcanoPointLight3 = new THREE.PointLight(0xfff4e6, 1.4, 100);
volcanoPointLight3.position.set(0, 18, -8); // Front warm light
window.scene.add(volcanoPointLight3);

const volcanoPointLight4 = new THREE.PointLight(0xffffff, 1.1, 100);
volcanoPointLight4.position.set(0, 25, 0); // Top light for better illumination
window.scene.add(volcanoPointLight4);

// Spotlight for dramatic accent lighting on volcano
const volcanoSpotLight = new THREE.SpotLight(0xfff4e6, 2.0, 200);
volcanoSpotLight.position.set(15, 30, 15);
volcanoSpotLight.angle = Math.PI / 6;
volcanoSpotLight.penumbra = 0.3;
volcanoSpotLight.decay = 2;
volcanoSpotLight.distance = 200;
volcanoSpotLight.target.position.set(0, 0, 0); // Focused on volcano
window.scene.add(volcanoSpotLight);
window.scene.add(volcanoSpotLight.target);


// GLTF Loader
const loader = new THREE.GLTFLoader();

// Variables for fade animation
window.terrain = null;
window.originalTerrainMaterial = null;
window.isFadingTerrain = false;
window.isFadingVolcano = false;
window.volcano = null;


// Load terrain model (single instance)
loader.load('mayon_FULL3.glb', ({ scene: terrainModel }) => {
    terrainModel.position.set(0, 0.15, 0); // Separated position to avoid overlap
    terrainModel.scale.set(0.25, 0.25, 0.25);
    terrainModel.rotation.set(0, -135, 0);

    // Store the original material for resetting
    terrainModel.traverse((child) => {
        if (child.isMesh && !window.originalTerrainMaterial) {
            window.originalTerrainMaterial = child.material.clone();
        }
    });

    // Clone the terrain model for Fresnel effect
    const terrainFresnel = terrainModel.clone();
    terrainFresnel.name = 'TerrainFresnel';
    terrainFresnel.scale.multiplyScalar(1.01); // Make it slightly larger
    terrainFresnel.position.y += 0.02; // Raise it slightly to avoid intersection

    // Apply Fresnel effect to the clone
    terrainFresnel.traverse((child) => {
        if (child.isMesh) {
            const fresnelMaterial = createFresnelMaterial(
                new THREE.Color(0x00ffff), // Cyan color for volcano
                2, // Fresnel power
                0.75 // Fresnel intensity
            );

            child.material = fresnelMaterial;
            child.userData.fresnelOutline = true; // Mark as processed
        }
    });

    window.scene.add(terrainModel);
    window.scene.add(terrainFresnel);
    console.log(terrainModel);
    terrainModel.name = 'Terrain';
    window.terrain = terrainModel;
    window.terrainFresnel = terrainFresnel;
}, undefined, function (error) {
    console.error('An error happened loading terrain:', error);
});


// Load volcano slice model
loader.load('mayon_slice_FULL3.glb', function (gltf) {
    window.volcano = gltf.scene;
    window.volcano.position.set(0, 0, 0);
    window.volcano.scale.set(0.25, 0.25, 0.25); // Reverted scale back to original 0.25
    window.volcano.rotation.set(0,-135, 0);

    // Enable transparency for fade animation
    window.volcano.traverse((child) => {
        if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = 1.0;

            // Mark this mesh as processed to avoid infinite recursion
            child.userData.fresnelProcessed = true;

            // Store original vertices for stretching
            const geometry = child.geometry;
            if (geometry.isBufferGeometry && geometry.attributes.position) {
                geometry.userData.originalVertices = geometry.attributes.position.array.slice();
            }
        }
    });



    window.scene.add(window.volcano);
    window.volcano.visible = true; // Always visible
    console.log(window.volcano);
}, undefined, function (error) {
    console.error('An error happened loading volcano:', error);
});

// Handle window resize
window.addEventListener('resize', function() {
    window.camera.aspect = window.innerWidth / window.innerHeight;
    window.camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    // Update smoke
    updateSmoke();
    updateAsh();
    // Update controls only if not fading or animating camera
    if (!window.isFadingTerrain && !window.isFadingVolcano && !window.isAnimatingCamera) {
        window.controls.update();
    }

    // Render the scene
    renderer.render(window.scene, window.camera);

    // Only update the camera coordinates display if the camera has moved
    const coordsDiv = document.getElementById('coordinates');
    if (coordsDiv) {
        const prevCoordsText = coordsDiv.textContent;
        const coordsText = `Camera: X: ${window.camera.position.x.toFixed(2)}, Y: ${window.camera.position.y.toFixed(2)}, Z: ${window.camera.position.z.toFixed(2)}`;
        if (coordsText !== prevCoordsText) {
            coordsDiv.textContent = coordsText;
        }
    }
}

// Start animation loop
animate();
