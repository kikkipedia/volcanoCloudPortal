const ashParticles = [];
const loadedAshTextures = [];
const ashGeometry = new THREE.PlaneGeometry(10, 10);

function createAshParticles() {
    console.log('createAsh called');

    const textureLoader = new THREE.TextureLoader();
    const ashTexturePaths = ['ash1.png', 'ash2.png'];

    const loadPromises = ashTexturePaths.map(path => {
        return new Promise((resolve, reject) => {
            textureLoader.load(
                path,
                (texture) => {
                    console.log(`Ash texture loaded successfully: ${path}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error('Error loading ash texture:', error);
                    reject(error);
                }
            );
        });
    });

    Promise.all(loadPromises).then(textures => {
        loadedAshTextures.push(...textures);
        console.log('All ash textures loaded successfully');

        const numParticles = 5; // A pool for ash particles
        for (let i = 0; i < numParticles; i++) {
            const randomTexture = loadedAshTextures[Math.floor(Math.random() * loadedAshTextures.length)];

            const ashMaterial = new THREE.MeshBasicMaterial({
                map: randomTexture,
                transparent: true,
                depthWrite: false,
                visible: false
            });

            const particle = new THREE.Mesh(ashGeometry, ashMaterial);
            particle.position.set(0.29, 7.26, 0.78);
            particle.rotation.x = -Math.PI / 2;
            particle.scale.set(0.2, 0.2, 0.2);
            particle.userData = {
                velocity: new THREE.Vector3(),
                birthTime: 0,
                lifetime: 0.15 + Math.random() * 0.1,
                isActive: false
            };
            ashParticles.push(particle);
            window.scene.add(particle);
        }
        console.log('Ash particles created:', ashParticles.length);
    }).catch(error => {
        console.error('Failed to load ash textures:', error);
    });
}

function updateAsh() {
    const now = Date.now();
    const stretch = window.volcanoStretch || 1.0;
    const gasDensity = window.gasDensity || 25;

    // Condition for ash burst
    if (gasDensity > 40 && stretch < 2 && Math.random() < 0.1) {
        // Find an inactive ash particle to launch
        const inactiveAsh = ashParticles.find(p => !p.userData.isActive);
        if (inactiveAsh) {
            inactiveAsh.visible = true;
            inactiveAsh.material.visible = true;
            inactiveAsh.userData.isActive = true;
            inactiveAsh.userData.birthTime = now;
            inactiveAsh.position.set(
                (Math.random() - 0.5) * 1.5,
                0,
                (Math.random() - 0.5) * 1.5
            );
            inactiveAsh.position.add(new THREE.Vector3(0.29, 7.26, 0.78));

            // Strong initial velocity for "burst"
            const burstSpeed = 0.01 + Math.random() * 0.01;
            inactiveAsh.userData.velocity.set(
                (Math.random() - 0.2) * 0.1,
                burstSpeed,
                (Math.random() - 0.2) * 0.1
            );

            // Randomly select a texture for the new particle
            const randomTexture = loadedAshTextures[Math.floor(Math.random() * loadedAshTextures.length)];
            inactiveAsh.material.map = randomTexture;
            inactiveAsh.material.opacity = 1.0;
        }
    }

    // Condition for ash burst in deep volcano
    if (gasDensity > 40 && stretch > 2.5 && Math.random() < 0.2) {
        // Find an inactive ash particle to launch
        const inactiveAsh = ashParticles.find(p => !p.userData.isActive);
        if (inactiveAsh) {
            inactiveAsh.visible = true;
            inactiveAsh.material.visible = true;
            inactiveAsh.userData.isActive = true;
            inactiveAsh.userData.birthTime = now;
            inactiveAsh.userData.lifetime = 0.3 + Math.random() * 0.2; // Longer lifetime for deep volcano ash
            inactiveAsh.userData.isDeepVolcano = true; // Flag for slower fall
            inactiveAsh.position.set(
                (Math.random() - 0.5) * 1.5,
                0,
                (Math.random() - 0.5) * 1.5
            );
            inactiveAsh.position.add(new THREE.Vector3(0.29, 7.26, 0.78));

            // Strong initial velocity for "burst"
            const burstSpeed = 0.01 + Math.random() * 0.01;
            inactiveAsh.userData.velocity.set(
                (Math.random() - 0.2) * 0.1,
                burstSpeed,
                (Math.random() - 0.2) * 0.1
            );

            // Randomly select a texture for the new particle
            const randomTexture = loadedAshTextures[Math.floor(Math.random() * loadedAshTextures.length)];
            inactiveAsh.material.map = randomTexture;
            inactiveAsh.material.opacity = 1.0;
        }
    }

    // Update active ash particles
    ashParticles.forEach(particle => {
        if (particle.userData.isActive) {
            const age = (now - particle.userData.birthTime) / 1000;
            if (age > particle.userData.lifetime) {
                // Deactivate particle
                particle.userData.isActive = false;
                particle.userData.isDeepVolcano = false; // Reset flag
                particle.visible = false;
                particle.material.visible = false;
            } else {
                // Apply gravity (slower for deep volcano ash)
                const gravity = particle.userData.isDeepVolcano ? 0.00005 : 0.0001;
                particle.userData.velocity.y -= gravity;

                // Update position
                particle.position.add(particle.userData.velocity);

                // Fade out
                const life = Math.min(age / particle.userData.lifetime, 1.0);
                particle.material.opacity = 1.0 - life;

                particle.lookAt(camera.position);
            }
        }
    });
}
