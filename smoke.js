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

    for (let i = 0; i < 50; i++) {
        const particle = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
        particle.position.set(
            (Math.random() - 0.5) * 1.5,
            0,
            (Math.random() - 0.5) * 1.5
        );
        particle.position.add(new THREE.Vector3(0.29, 7.26, 0.78));
        particle.rotation.x = -Math.PI / 2;
        particle.userData.velocity = new THREE.Vector3(0, Math.random() * 0.1 + 0.1, 0);
        particle.userData.birthTime = Date.now(); // Add birth time
        particle.material.uniforms.opacity.value = Math.random() * 0.5 + 0.2;
        smokeParticles.push(particle);
        window.scene.add(particle);
    }

    console.log('Smoke particles:', smokeParticles.length);
}

function updateSmoke() {
    const now = Date.now();
    smokeParticles.forEach(particle => {
        const age = (now - particle.userData.birthTime) / 1000; // age in seconds
        const speed = window.smokeSpeed || 0.5;

        // Move particle based on velocity and speed
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(speed));
        
        // Look at the camera
        particle.lookAt(camera.position);

        // If particle is older than 2 seconds, reset it
        if (age > 1.5) {
            particle.position.set(
                (Math.random() - 0.5) * 1.5,
                0,
                (Math.random() - 0.5) * 1.5
            );
            particle.position.add(new THREE.Vector3(0.29, 7.26, 0.78));
            particle.userData.birthTime = now; // Reset birth time
        }

        // Update opacity based on age (fade out over 2 seconds)
        const life = age / 2.0; // 0.0 to 1.0
        particle.material.uniforms.opacity.value = 1.0 - life;
    });
}
