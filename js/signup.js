const address = "http://localhost:3000"

// Used to ensure password contains at least one uppercase letter, one lowercase letter, one number, one special character, and is between 8-16 characters long
// Returns true if password is valid, false otherwise
function validatePassword(password) {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:'",.<>\/?~`]).{8,16}$/;
    return passwordPattern.test(password);
};

// Trigger sign-up action in back-end in successful submit
const signupForm = document.getElementById("signup-form");
signupForm.addEventListener('submit', (event) => {
    // prevent page from refreshing
    event.preventDefault();

    // Create an empty object to hold form data
    const formData = {};

    // Get all input elements inside the form
    const inputs = signupForm.querySelectorAll('input');

    // Loop through all input elements and add their values to the formData object
    inputs.forEach(input => {
        formData[input.name] = input.value;
    });

    console.log(JSON.stringify(formData));

    // Check if password is valid
    if (!validatePassword(formData.password)) {
        // Display error message if password is invalid
        const errorMessage = document.getElementById('error-message');

        errorMessage.innerText = "Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be between 8-16 characters long.";
        errorMessage.classList.remove('hidden');
        document.getElementById('password').classList.add('input-error');
        return;
    } else if (formData.password !== formData['confirm-password']) {
        // Display error message if password and confirm password do not match
        const errorMessage = document.getElementById('error-message');

        errorMessage.innerText = "Passwords do not match.";
        errorMessage.classList.remove('hidden');
        document.getElementById('password').classList.add('input-error');
        document.getElementById('confirm-password').classList.add('input-error');
        return;
    } else {
        // Clear error message if password is valid
        document.getElementById('error-message').classList.add('hidden');
    }

    // Send a POST request to the backend
    fetch(`${address}/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Sending form data as a JSON string
    })
    .then(res => {
        switch (res.status) {
            case 201:
                // Redirect to login.html upon successful sign-up
                window.location.href = 'login.html';
                break; // Added break to prevent fallthrough
            case 409:
                // Handle Conflict (409) response
                const errorMessage = document.getElementById('error-message');
                errorMessage.innerText = "Username already exists.";
                errorMessage.classList.remove('hidden');
                document.getElementById('username').classList.add('input-error');
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