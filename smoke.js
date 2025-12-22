const smokeParticles = [];

function createSmoke() {
    console.log('createSmoke called');

    const textureLoader = new THREE.TextureLoader();
    const smokeTexture = textureLoader.load('volcano_smoke1_whiteBG.png');

    const smokeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            smokeTexture: { value: smokeTexture },
            opacity: { value: 1.0 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D smokeTexture;
            uniform float opacity;
            varying vec2 vUv;

            void main() {
                vec4 tex = texture2D(smokeTexture, vUv);

                // Derive alpha from brightness (white background = transparent)
                float lum = (tex.r + tex.g + tex.b) / 3.0;
                float alpha = (1.0 - lum) * opacity;

                // Smoke color (white smoke)
                vec3 color = vec3(1.0) * alpha;

                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        depthWrite: false
    });

    const smokeGeometry = new THREE.PlaneGeometry(10, 10);

    const numParticles = window.gasDensity || 50;
    for (let i = 0; i < numParticles; i++) {
        const particle = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
        particle.position.set(
            (Math.random() - 0.5) * 1.5,
            0,
            (Math.random() - 0.5) * 1.5
        );
        particle.position.add(new THREE.Vector3(0.29, 7.26, 0.78));
        particle.rotation.x = -Math.PI / 2;
        particle.userData.velocity = new THREE.Vector3(0, Math.random() * 0.1 + 0.1, 0);
        // Stagger the birth time to create a continuous stream
        particle.userData.birthTime = Date.now() - Math.random() * (window.smokeLifetime || 2.5) * 1000;
        particle.material.uniforms.opacity.value = Math.random() * 0.5 + 0.2;
        smokeParticles.push(particle);
        window.scene.add(particle);
    }

    console.log('Smoke particles:', smokeParticles.length);
}

function updateSmoke() {
    const now = Date.now();
    const speed = window.smokeSpeed || 1.0;
    const height = window.smokeHeight || 1.0;
    const lifetime = window.smokeLifetime || 2.5;
    const depthFactor = window.smokeDepthFactor || 1.0;

    smokeParticles.forEach(particle => {
        const age = (now - particle.userData.birthTime) / 1000; // age in seconds

        // Calculate scaled velocity
        const scaledVelocity = particle.userData.velocity.clone();
        scaledVelocity.y *= height;
        
        // Apply depth factor to vertical force, linking it to volcano stretch
        scaledVelocity.y *= depthFactor;

        scaledVelocity.multiplyScalar(speed);

        // Move particle
        particle.position.add(scaledVelocity);
        
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
        }

        // Update opacity based on age (fade out over its lifetime)
        const life = age / lifetime; // 0.0 to 1.0
        particle.material.uniforms.opacity.value = 1.0 - life;
    });
}
