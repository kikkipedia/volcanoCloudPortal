const smokeParticles = [];

function createSmoke() {
    const textureLoader = new THREE.TextureLoader();
    const smokeTexture = textureLoader.load('volcano_smoke1.png');

    const smokeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            smokeTexture: { type: 't', value: smokeTexture },
            opacity: { type: 'f', value: 1.0 }
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
                gl_FragColor = texture2D(smokeTexture, vUv);
                gl_FragColor.a *= opacity;
            }
        `,
        transparent: true,
        depthWrite: false
    });

    const smokeGeometry = new THREE.PlaneGeometry(3, 3);

    for (let i = 0; i < 50; i++) {
        const particle = new THREE.Mesh(smokeGeometry, smokeMaterial.clone());
        particle.position.set(
            (Math.random() - 0.5) * 1.5,
            0,
            (Math.random() - 0.5) * 1.5
        );
        particle.position.add(new THREE.Vector3(0.29, 7.26, 0.78));
        particle.rotation.x = -Math.PI / 2;
        particle.userData.velocity = new THREE.Vector3(0, Math.random() * 0.05 + 0.05, 0);
        particle.material.uniforms.opacity.value = Math.random() * 0.3;
        smokeParticles.push(particle);
        window.scene.add(particle);
    }
}

function updateSmoke() {
    smokeParticles.forEach(particle => {
        particle.position.add(particle.userData.velocity);
        particle.material.uniforms.opacity.value -= 0.001;

        if (particle.material.uniforms.opacity.value <= 0) {
            particle.position.set(
                (Math.random() - 0.5) * 1.5,
                0,
                (Math.random() - 0.5) * 1.5
            );
            particle.position.add(new THREE.Vector3(0.29, 7.26, 0.78));
            particle.material.uniforms.opacity.value = Math.random() * 0.3;
        }
    });
}
