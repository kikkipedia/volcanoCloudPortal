const smokeCubeGeometry = new THREE.BoxGeometry(1, 1, 1);
const smokeCubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    transparent: true,   // REQUIRED
    opacity: 0.3         // 0 = invisible, 1 = solid
});
const smokeCube = new THREE.Mesh(smokeCubeGeometry, smokeCubeMaterial);
smokeCubeGeometry.userData.isRedCube = true;
smokeCubeGeometry.userData.isGlowing = false;

// Position the red cube in front of the slice model
smokeCube.position.set(0.29, 7.26, 0.78);

scene.add(smokeCube);