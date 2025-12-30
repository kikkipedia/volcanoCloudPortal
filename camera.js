function toggleCameraControls() {
    if (window.controls) {
        window.controls.enabled = !window.controls.enabled;
        const button = document.getElementById('toggle-camera-btn');
        if (window.controls.enabled) {
            // Enable limited movement: -30 to 30 degrees horizontal, no vertical, limited zoom to y=9 to 18
            window.controls.minAzimuthAngle = -Math.PI / 6; // -30 degrees
            window.controls.maxAzimuthAngle = Math.PI / 6;  // 30 degrees
            window.controls.minPolarAngle = window.initialPolarAngle; // No vertical movement
            window.controls.maxPolarAngle = window.initialPolarAngle;
            const cosTheta = Math.cos(window.initialPolarAngle);
            window.controls.minDistance = 9 / cosTheta; // Zoom in until y=9
            window.controls.maxDistance = 18 / cosTheta; // Zoom out until y=18
            button.textContent = 'Camera Control On';
        } else {
            // Disable controls and reset limits
            window.controls.minAzimuthAngle = -Infinity;
            window.controls.maxAzimuthAngle = Infinity;
            window.controls.minPolarAngle = 0;
            window.controls.maxPolarAngle = Math.PI;
            window.controls.minDistance = 0;
            window.controls.maxDistance = Infinity;
            button.textContent = 'Camera Control Off';
        }
        console.log('Camera controls ' + (window.controls.enabled ? 'enabled' : 'disabled'));
    }
}
