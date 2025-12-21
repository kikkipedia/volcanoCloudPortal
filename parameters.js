window.smokeSpeed = 1.0; // Default smoke speed multiplier

const parametersButton = document.getElementById('parameters-btn');
const popup = document.getElementById('parameters-popup');

if (parametersButton && popup) {
    parametersButton.addEventListener('click', () => {
        if (popup.style.display === 'none') {
            popup.style.display = 'block';
        } else {
            popup.style.display = 'none';
        }
    });
}

const temperatureSlider = document.getElementById('temperature-slider');
if (temperatureSlider) {
    temperatureSlider.addEventListener('input', (event) => {
        window.smokeSpeed = parseFloat(event.target.value);
    });
}
