let prevNumActiveParticles = 0;
const smokeParticles = [];
const loadedTextures = [];
const smokeGeometry = new THREE.PlaneGeometry(10, 10);

function lerp(a, b, alpha) {
    return a + alpha * (b - a);
}

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

    // Depth-based movement speed
    const stretch = window.volcanoStretch || 1.0;
    const normalizedStretch = Math.max(0, Math.min(1, (stretch - 1.0) / 2.0));
    const depthDampening = 1.0 - normalizedStretch * 0.8;

    const temperature = (window.temperature ?? 10) * 5;
    const gasDensity = window.gasDensity || 25;
    const gasAmountNormalized = gasDensity / 100;

    // --- Smoothed Temperature-based physics using interpolation ---
    const tempLow = { lf: 1.0, vf: 0.01, bm: 0.1, hdx: 0.015, hdz: 0.015 }; // Low temp properties
    const tempMed = { lf: 1.0, vf: 0.375, bm: 1.5, hdx: 0.005, hdz: 0.01 }; // Medium temp properties
    const tempHigh = { lf: 3.0, vf: 0.5, bm: 1.5, hdx: 0.005, hdz: 0.01 }; // High temp properties

    let temperatureLifetimeMultiplier, effectiveVerticalForce, effectiveBuoyancyMultiplier, effectiveHorizontalDriftX, effectiveHorizontalDriftZ;

    if (temperature <= 50) { // Interpolate between Low and Medium
        const t = temperature / 50;
        temperatureLifetimeMultiplier = lerp(tempLow.lf, tempMed.lf, t);
        effectiveVerticalForce = lerp(tempLow.vf, tempMed.vf, t);
        effectiveBuoyancyMultiplier = lerp(tempLow.bm, tempMed.bm, t);
        effectiveHorizontalDriftX = lerp(tempLow.hdx, tempMed.hdx, t);
        effectiveHorizontalDriftZ = lerp(tempLow.hdz, tempMed.hdz, t);
    } else { // Interpolate between Medium and High
        const t = (temperature - 50) / 50;
        temperatureLifetimeMultiplier = lerp(tempMed.lf, tempHigh.lf, t);
        effectiveVerticalForce = lerp(tempMed.vf, tempHigh.vf, t);
        effectiveBuoyancyMultiplier = lerp(tempMed.bm, tempHigh.bm, t);
        effectiveHorizontalDriftX = lerp(tempMed.hdx, tempHigh.hdx, t);
        effectiveHorizontalDriftZ = lerp(tempMed.hdz, tempHigh.hdz, t);
    }

    effectiveVerticalForce *= speed;

    const baseLifetime = window.smokeLifetime || 2.5;
    const lifetime = baseLifetime * (0.2 + 0.8 * gasAmountNormalized) * temperatureLifetimeMultiplier;

    // --- Gas Density adjustments ---
    const numActiveParticles = Math.floor(gasAmountNormalized * smokeParticles.length);
    const minOpacity = 0.1;
    const maxOpacity = 0.8;
    const opacityMultiplier = minOpacity + (maxOpacity - minOpacity) * gasAmountNormalized;
    const scaleMultiplier = 0.5 + 1.5 * gasAmountNormalized;

    // --- Stagger birth of newly activated particles to prevent bursts ---
    if (numActiveParticles > prevNumActiveParticles) {
        const numNew = numActiveParticles - prevNumActiveParticles;
        for (let i = prevNumActiveParticles; i < numActiveParticles; i++) {
            if (smokeParticles[i]) {
                const stagger = ((i - prevNumActiveParticles) / numNew) * 1000; // Stagger over 1 second
                smokeParticles[i].userData.birthTime = now - stagger;
            }
        }
    }
    prevNumActiveParticles = numActiveParticles;


    smokeParticles.forEach((particle, index) => {
        if (index >= numActiveParticles) {
            particle.visible = false;
            return;
        }
        particle.visible = true;

        const age = (now - particle.userData.birthTime) / 1000;

        if (age > lifetime) {
            particle.position.set((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5);
            particle.position.add(new THREE.Vector3(0.29, 7.26, 0.78));
            particle.userData.birthTime = now - Math.random() * 500; // Stagger respawn
            particle.scale.set(0.1, 0.1, 0.1);
            const randomTexture = loadedTextures[Math.floor(Math.random() * loadedTextures.length)];
            particle.material.map = randomTexture;
        }

        // --- Particle velocity ---
        let velX, velZ;
        if (temperature <= 50) { // Jiggle for low-mid temp range
            const t = temperature / 50;
            const driftX = lerp(tempLow.hdx, tempMed.hdx, t);
            const driftZ = lerp(tempLow.hdz, tempMed.hdz, t);
            velX = (Math.random() - 0.5) * driftX;
            velZ = (Math.random() - 0.5) * driftZ;
        } else { // Directed drift for mid-high temp
            velX = effectiveHorizontalDriftX;
            velZ = effectiveHorizontalDriftZ;
        }
        
        let totalUpwardForce = (Math.random() * effectiveVerticalForce + effectiveVerticalForce / 2) + (temperature * 0.001 * effectiveBuoyancyMultiplier);

        const ageProgress = Math.min(1.0, age / lifetime);
        let ageDampingFactor = 0.85;
        if (stretch < 0.9) ageDampingFactor = 0.95; // Faster die down for shallow
        const ageDamping = 1.0 - (ageProgress * ageDampingFactor);
        totalUpwardForce *= ageDamping;
        
        const velY = totalUpwardForce;
        const scaledVelocity = new THREE.Vector3(velX, velY, velZ);

        scaledVelocity.y *= height;
        scaledVelocity.multiplyScalar(depthDampening);

        particle.position.add(scaledVelocity);

        // --- Update scale, orientation, and opacity ---
        const growthProgress = Math.min(age / lifetime, 1.0);
        const finalMaxScale = particle.userData.maxScale * scaleMultiplier;
        const currentScale = 0.1 + (finalMaxScale - 0.1) * growthProgress;
        particle.scale.set(currentScale, currentScale, currentScale);

        particle.lookAt(camera.position);

        const life = Math.min(age / lifetime, 1.0);
        particle.material.opacity = (1.0 - life) * opacityMultiplier;
    });
}
