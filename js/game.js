const address = "http://localhost:3000";
let currentStep = 0; // Variable para controlar el paso actual

// Elementos que queremos mostrar en cada clic
const elements = [
    document.getElementById('track-image'),
    document.getElementById('track-year'),
    document.getElementById('track-artist')
];

// Intentamos obtener todas las casillas
const attemptBoxes = document.querySelectorAll('.attempt-box');

// Evento que se ejecuta al hacer clic en el botón
document.getElementById('show-elements-btn').addEventListener('click', function() {
    if (currentStep < elements.length) {
        // Mostrar el siguiente elemento
        elements[currentStep].classList.remove('hidden');
        // Rellenar la casilla correspondiente
        attemptBoxes[currentStep].style.backgroundColor = '#4CAF50';  

        currentStep++; 
    }
});

document.getElementById('shuffle-btn').addEventListener('click', function() {
    const token = localStorage.getItem('jwtToken');
    fetch(`${address}/track/random`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json', // Important for JSON payload
            'Authorization': `Bearer ${token}` // Send the JWT token in the header
        }
    })  .then(response => {
            switch (response.status) {
                case 200:
                    return response.json();
                default:
                    response.json().then(data => {
                        sessionStorage.setItem('httpStatus', response.status);
                        sessionStorage.setItem('customMessage', data.message);
                    });
                    throw new Error('Error fetching track data');
            }
        })
        .then(data => {
            document.getElementById('track-image').src = data.image_url;
            document.getElementById('track-image').classList.remove('hidden');

            document.getElementById('track-year').textContent = `Release date: ${data.release_date}`;
            document.getElementById('track-year').classList.remove('hidden');

            document.getElementById('track-artist').textContent = `Artist: ${data.artist}`;
            document.getElementById('track-artist').classList.remove('hidden');
        })
        .catch(error => console.error('Error fetching data:', error));
});
