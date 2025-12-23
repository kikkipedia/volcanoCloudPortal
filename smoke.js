const smokeParticles = [];
const loadedTextures = [];

function createSmoke() {
    console.log('createSmoke called');

    const textureLoader = new THREE.TextureLoader();

    // Define the three texture paths
    const texturePaths = ['volcano_smoke1.png', 'smoke_var2.png', 'smoke_var3.png'];

    // Load all textures asynchronously
    const loadPromises = texturePaths.map(path => {
        return new Promise((resolve, reject) => {
            textureLoader.load(
                path,
                (texture) => {
                    console.log(`Smoke texture loaded successfully: ${path}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error('Error loading smoke texture:', error);
                    reject(error);
                }
            );
        });
    });

    Promise.all(loadPromises).then(textures => {
        loadedTextures.push(...textures);
        console.log('All smoke textures loaded successfully');

        const smokeGeometry = new THREE.PlaneGeometry(10, 10);

        const numParticles = window.gasDensity || 25;
        for (let i = 0; i < numParticles; i++) {
            // Randomly select one of the loaded textures
            const randomTexture = loadedTextures[Math.floor(Math.random() * loadedTextures.length)];

            const smokeMaterial = new THREE.MeshBasicMaterial({
                map: randomTexture,
                transparent: true,
                depthWrite: false
            });

            const particle = new THREE.Mesh(smokeGeometry, smokeMaterial);
            particle.position.set(
                (Math.random() - 0.5) * 1.5,
                0,
                (Math.random() - 0.5) * 1.5
            );
            particle.position.add(new THREE.Vector3(0.29, 7.26, 0.78));
            particle.rotation.x = -Math.PI / 2;
            particle.scale.set(0.1, 0.1, 0.1); // Start small
            particle.userData.velocity = new THREE.Vector3(0, 0.1, 0); // Baseline, will be scaled dynamically
            // Stagger the birth time to create a continuous stream
            particle.userData.birthTime = Date.now() - Math.random() * (window.smokeLifetime || 2.5) * 1000;
            particle.userData.maxScale = 0.1 + Math.random() * 1.5; // Random max scale between 0.1 and 1.6
            particle.material.opacity = Math.random() * 0.5 + 0.2;
            smokeParticles.push(particle);
            window.scene.add(particle);
        }

        console.log('Smoke particles:', smokeParticles.length);
    }).catch(error => {
        console.error('Failed to load smoke textures:', error);
    });
}

function updateSmoke() {

    const now = Date.now();

    const speed = window.smokeSpeed || 1.0;

    const height = window.smokeHeight || 1.0; // This is a general height multiplier

    const lifetime = window.smokeLifetime || 2.5;

    const depthFactor = window.smokeDepthFactor || 1.0;

    const temperature = window.temperature || 20; // Current temperature (0-100)

    const gasDensity = window.gasDensity || 50; // Current gas density (10-100)



    // --- Temperature-based dynamic adjustments ---

    let effectiveVerticalForce = 0.1; // Base upward force

    let effectiveBuoyancyMultiplier = 1.0; // How much buoyancy is applied

    let effectiveExpansionRateMultiplier = 1.0; // How much expansion is applied

    if (temperature <= 33) { // Low: Almost no rise

        effectiveVerticalForce = 0.05; // Very low vertical push

        effectiveBuoyancyMultiplier = 0.5; // Less buoyancy

        effectiveExpansionRateMultiplier = 1.5; // More expansion

    } else if (temperature <= 66) { // Medium: Moderate rise

        effectiveVerticalForce = 0.20; // Moderate vertical push

        effectiveBuoyancyMultiplier = 1.0; // Normal buoyancy

        effectiveExpansionRateMultiplier = 1.0; // Normal expansion

    } else { // High: High rising column

        effectiveVerticalForce = 0.375; // Strong vertical push

        effectiveBuoyancyMultiplier = 1.5; // More buoyancy

        effectiveExpansionRateMultiplier = 0.5; // Less expansion (more coherent)

    }

    // Fixed consistent horizontal drifts, slower than previous variable speeds

    let effectiveHorizontalDriftX = 0.005;

    let effectiveHorizontalDriftZ = 0.01;

    // --- End temperature adjustments ---



    // --- Gas Density adjustments ---

    const gasAmountNormalized = gasDensity / 100; // Normalize gas density to 0-1 range

    const maxOpacityInfluence = 0.4; // From user's formula

    const maxTurbulenceStrengthInfluence = 0.3; // From user's formula



    const opacityInfluence = gasAmountNormalized * maxOpacityInfluence;

    const turbulenceStrength = gasAmountNormalized * maxTurbulenceStrengthInfluence;



    // Apply turbulence strength to horizontal drift

    effectiveHorizontalDriftX += turbulenceStrength; // Add to existing drift

    effectiveHorizontalDriftZ += turbulenceStrength; // Add to existing drift

    // --- End Gas Density adjustments ---





    smokeParticles.forEach(particle => {

        const age = (now - particle.userData.birthTime) / 1000; // age in seconds



        // Reinitialize particle velocity based on current effective values and some randomness

        // This makes the smoke dynamic based on slider changes

        const randomX = effectiveHorizontalDriftX; // Continuous right drift

        const randomY = Math.random() * effectiveVerticalForce + effectiveVerticalForce / 2; // Keep Y a bit random within its range

        const randomZ = (Math.random() - 0.5) * effectiveHorizontalDriftZ;



        // Clone a base velocity, then apply dynamic forces

        const scaledVelocity = new THREE.Vector3(randomX, randomY, randomZ);



        // Apply general height multiplier (from smokeHeight slider)

        scaledVelocity.y *= height;

        

        // Apply depth factor to vertical force (from volcano stretch)

        scaledVelocity.y *= depthFactor;



        // Apply buoyancy based on temperature, scaled by effectiveBuoyancyMultiplier

        const buoyancy = temperature * 0.001 * effectiveBuoyancyMultiplier;

        scaledVelocity.y += buoyancy;



        // Apply general speed multiplier (from smokeSpeed slider)

        scaledVelocity.multiplyScalar(speed);



        // Move particle

        particle.position.add(scaledVelocity);

        

        // Grow scale from 0.1 to maxScale over lifetime, with variety in maxScale

        const growthProgress = age / lifetime;

        const currentScale = 0.1 + (particle.userData.maxScale - 0.1) * growthProgress;

        particle.scale.set(currentScale, currentScale, currentScale);



        // Look at the camera

        particle.lookAt(camera.position);



        // If particle is older than its lifetime, reset it
        if (age > lifetime) {
            particle.position.set(
                (Math.random() - 0.5) * 1.5,
                0,
                (Math.random() - 0.5) * 1.5
            );
            particle.position.add(new THREE.Vector3(0.29, 7.26, 0.78));
            particle.userData.birthTime = now; // Reset birth time
            // Reset particle scale when it resets
            particle.scale.set(0.1, 0.1, 0.1);
            // Randomly assign a new texture
            const randomTexture = loadedTextures[Math.floor(Math.random() * loadedTextures.length)];
            particle.material.map = randomTexture;
        }



        // Update opacity based on age (fade out over its lifetime)

        const life = age / lifetime; // 0.0 to 1.0

        // Apply opacity influence from gas density

        particle.material.opacity = (1.0 - life) * opacityInfluence;

    });

}
