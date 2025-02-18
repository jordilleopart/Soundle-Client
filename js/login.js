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

    console.log(JSON.stringify(formData));

    // Send a POST request to the backend
    fetch(`${address}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Sending form data as a JSON string
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`${res.status}`);
        }
        
        // extract and store JWT token
        const JWTToken = res.headers.get("Authorization").split(' ')[1];
        localStorage.setItem('jwtToken', JWTToken);

        // Redirect to home.html upon successful login
        window.location.href = 'home.html';
    })
    .catch(error => {
        // Catch and handle errors
        alert(`${error.message}`);
    });
});