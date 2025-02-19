const address = "http://localhost:3000"

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
    fetch(`${address}/login`, {
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
        
                // Redirect to home.html upon successful login
                window.location.href = 'home.html';
                break; // Added break to prevent fallthrough
            case 401:
                // Handle Unauthorized (401) response
                
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