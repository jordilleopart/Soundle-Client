//const GOOGLE_CLIENT_ID = "623629811260-l8ivmgl62t9lvdt9clo2203hcmdm37vr.apps.googleusercontent.com";

// Trigger login action in back-end in successful submit
const loginForm = document.getElementById("login-form");
loginForm.addEventListener('submit', (event) => {
    // prevent page from refreshing
    event.preventDefault();

    // Create an empty object to hold form data
    const formData = {};

    // Get all input elements inside the form
    const inputs = loginForm.querySelectorAll('input');

    // Loop through all input elements and add their values to the formData object
    inputs.forEach(input => {
        formData[input.name] = input.value;
    });

    // Send a POST request to the backend
    fetch(`${config.address}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Sending form data as a JSON string
    })
    .then(res => {
        switch (res.status) {
            case 200:
                // Extract and store JWT token
                const JWTToken = res.headers.get("Authorization").split(' ')[1];
                localStorage.setItem('jwtToken', JWTToken);
                // store username
                localStorage.setItem('username', formData['username']);
        
                // Redirect to home.html upon successful login
                window.location.href = 'home.html';
                break; // Added break to prevent fallthrough
            case 401:
                // Handle Unauthorized (401) response
                const errorMessage = document.getElementById('error-message');
                errorMessage.innerText = "Invalid username or password.";
                errorMessage.classList.remove('hidden');
                document.getElementById('username').classList.add('input-error');
                document.getElementById('password').classList.add('input-error');
                break;
            default:
                // Handle other error responses (e.g., 400, 500, etc.)
                res.json().then(data => {
                    sessionStorage.setItem('httpStatus', res.status);
                    sessionStorage.setItem('customMessage', data.message);
                });
                // Redirect to error-template.html upon error
                window.location.href = 'error-template.html';
                break;
        }
    });
});


// Inicializar Google Identity Services cuando la página cargue
window.onload = function () {
    fetch(`${config.address}/login/google-client-id`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(res => {
            if (!res.ok) {
                throw new Error('No se pudo obtener el Google Client ID');
            }
            return res.json(); // Parsear la respuesta JSON
        })
        .then(data => {
            const clientId = data.client_id; // Extraer el client_id del JSON

            // Inicializar Google Identity Services con el client_id obtenido
            google.accounts.id.initialize({
                client_id: clientId, // Usar el Client ID obtenido del backend
                callback: handleGoogleLoginResponse // Función que manejará la respuesta
            });

            // Agregar un evento al botón personalizado
            const googleButton = document.getElementById("google-button");
            googleButton.addEventListener("click", () => {
                google.accounts.id.prompt(); // Mostrar el flujo de inicio de sesión de Google
            });
        })
        .catch(err => {
            console.error('Error al inicializar Google Identity Services:', err);
        });
};


// Función para manejar la respuesta del login con Google
function handleGoogleLoginResponse(response) {
    console.log("Token de Google:", response.credential);
    // Enviar el token al backend para validarlo
    const googleToken = response.credential;

    // Enviar el token al backend para validarlo y generar un JWT
    fetch('/api/login/google', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: googleToken }) // Enviar el token al backend
    })
    .then(res => {
        if (res.ok) {
            return res.json(); // Parsear la respuesta del backend
        } else {
            throw new Error('Error al iniciar sesión con Google');
        }
    })
    .then(data => {
        // Guardar el JWT recibido del backend en el almacenamiento local
        localStorage.setItem('jwt', data.jwt);
        alert('Inicio de sesión exitoso');
        // Redirigir al usuario a la página principal o dashboard
        window.location.href = '/error-template.html';
    })
    .catch(err => {
        console.error(err);
        alert('Error al iniciar sesión con Google');
    });
}