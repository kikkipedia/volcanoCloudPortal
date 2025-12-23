let prevNumActiveParticles = 0;
const smokeParticles = [];
const loadedTextures = [];
const smokeGeometry = new THREE.PlaneGeometry(10, 10);

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

    const numParticles = 150; // Create a fixed pool of particles
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
            particle.userData.velocity = new THREE.Vector3(0, Math.random() * 0.01 + 0.01, 0); // Baseline, will be scaled dynamically
            // particle.userData.velocity.x = (Math.random() - 0.5) * 0.0005;
            // Stagger the birth time to create a continuous stream
            particle.userData.birthTime = Date.now() - Math.random() * 2.5 * 1000;
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
    const speed = window.smokeSpeed || 0.01;
    const height = window.smokeHeight || 1.0;
    const depthFactor = window.smokeDepthFactor || 1.0;
    const stretch = window.volcanoStretch || 1.0;
    let depthCategory = 'medium';
    if (stretch < 0.9) depthCategory = 'shallow';
    else if (stretch > 1.1) depthCategory = 'deep';

    let verticalMultiplier = 1.0;
    let horizontalMultiplier = 1.0;
    if (depthCategory === 'shallow') {
        verticalMultiplier = 1.5;
        horizontalMultiplier = 0.5;
    } else if (depthCategory === 'deep') {
        verticalMultiplier = 0.5;
        horizontalMultiplier = 1.5;
    } else {
        verticalMultiplier = depthFactor;
    }
    verticalMultiplier *= height;

    const temperature = (window.temperature || 10) * 5;
    const gasDensity = window.gasDensity || 25;
    const gasAmountNormalized = gasDensity / 100;

    // --- Gas Density adjustments ---
    const numActiveParticles = Math.floor(gasAmountNormalized * smokeParticles.length);
    const baseLifetime = window.smokeLifetime || 2.5;
    const lifetime = baseLifetime * (0.2 + 0.8 * gasAmountNormalized);
    const minOpacity = 0.1;
    const maxOpacity = 0.8;
    const opacityMultiplier = minOpacity + (maxOpacity - minOpacity) * gasAmountNormalized;
    const scaleMultiplier = 0.5 + 1.5 * gasAmountNormalized;

    // --- Stagger birth of newly activated particles to prevent bursts ---
    if (numActiveParticles > prevNumActiveParticles) {
        for (let i = prevNumActiveParticles; i < numActiveParticles; i++) {
            if (smokeParticles[i]) {
                // Initialize with a random age so they don't all appear at once
                smokeParticles[i].userData.birthTime = now - Math.random() * lifetime * 1000;
            }
        }
    }
    prevNumActiveParticles = numActiveParticles;

    // --- Temperature-based dynamic adjustments ---
    let effectiveVerticalForce = 0.05;
    let effectiveBuoyancyMultiplier = 1.0;
    // ... (rest of temperature logic is the same)
    let effectiveExpansionRateMultiplier = 1.0;
    let effectiveHorizontalDriftX = 0.005 * horizontalMultiplier;
    let effectiveHorizontalDriftZ = 0.01 * horizontalMultiplier;

    if (temperature <= 33) {
        effectiveVerticalForce = 0.005;
        effectiveBuoyancyMultiplier = 0.1;
        effectiveExpansionRateMultiplier = 1.5;
        effectiveHorizontalDriftX = 0.02 * horizontalMultiplier;
        effectiveHorizontalDriftZ = 0.04 * horizontalMultiplier;
    } else if (temperature <= 66) {
        effectiveVerticalForce = 0.25;
        effectiveBuoyancyMultiplier = 1.0;
        effectiveExpansionRateMultiplier = 1.0;
    } else {
        effectiveVerticalForce = 0.375;
        effectiveBuoyancyMultiplier = 1.5;
        effectiveExpansionRateMultiplier = 0.5;
    }
    effectiveVerticalForce *= speed;

    smokeParticles.forEach((particle, index) => {
        if (index >= numActiveParticles) {
            particle.visible = false;
            return;
        }
        particle.visible = true;

        const age = (now - particle.userData.birthTime) / 1000;

        if (age > lifetime) {
            particle.position.set(
                (Math.random() - 0.5) * 1.5,
                0,
                (Math.random() - 0.5) * 1.5
            );
            particle.position.add(new THREE.Vector3(0.29, 7.26, 0.78));
            // Add a small random offset to the reset time to de-synchronize particles
            particle.userData.birthTime = now - Math.random() * 500;
            particle.scale.set(0.1, 0.1, 0.1);
            const randomTexture = loadedTextures[Math.floor(Math.random() * loadedTextures.length)];
            particle.material.map = randomTexture;
        }

        // --- Particle update logic ---
        const randomX = effectiveHorizontalDriftX;
        const randomY = Math.random() * effectiveVerticalForce + effectiveVerticalForce / 2;
        const randomZ = (Math.random() - 0.5) * effectiveHorizontalDriftZ;
        const scaledVelocity = new THREE.Vector3(randomX, randomY, randomZ);

        if (depthCategory === 'shallow') {
            const decayFactor = Math.max(0.3, 1 - age / lifetime);
            scaledVelocity.y *= verticalMultiplier * decayFactor;
        } else {
            scaledVelocity.y *= verticalMultiplier;
        }

        const buoyancy = temperature * 0.001 * effectiveBuoyancyMultiplier;
        scaledVelocity.y += buoyancy;

        particle.position.add(scaledVelocity);

        if (temperature > 33 && temperature <= 66) {
            particle.rotation.y += 0.01;
        }

        const growthProgress = Math.min(age / lifetime, 1.0);
        const finalMaxScale = particle.userData.maxScale * scaleMultiplier;
        const currentScale = 0.1 + (finalMaxScale - 0.1) * growthProgress;
        particle.scale.set(currentScale, currentScale, currentScale);

        particle.lookAt(camera.position);

        const life = Math.min(age / lifetime, 1.0);
        particle.material.opacity = (1.0 - life) * opacityMultiplier;
    });
}