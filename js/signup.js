// Used to ensure password contains at least one uppercase letter, one lowercase letter, one number, one special character, and is between 8-16 characters long
// Returns true if password is valid, false otherwise
function validatePassword(password) {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:'",.<>\/?~`]).{8,16}$/;
    return passwordPattern.test(password);
};

function toCamelCase(str) {
    return str
      .replace(/-./g, match => match.charAt(1).toUpperCase())  // Replace hyphen + next letter with uppercase
      .replace(/-/g, '');  // Remove remaining hyphens
};

function validateString(inputString) {
    // Remove leading and trailing whitespaces
    inputString = inputString.trim();
    
    // Check if the string is longer than 50 characters
    if (inputString.length > 50) {
        return false;
    }

    // Check if the string contains spaces in between
    if (inputString.includes(' ')) {
        return false;
    }

    // If all checks are passed, return true
    return true;
}

// Trigger sign-up action in back-end in successful submit
const signupForm = document.getElementById("signup-form");
signupForm.addEventListener('submit', (event) => {
    let validLength = true;

    // prevent page from refreshing
    event.preventDefault();

    // Create an empty object to hold form data
    const formData = {};

    // Get all input elements inside the form
    const inputs = signupForm.querySelectorAll('input');

    // Loop through all input elements and add their values to the formData object
    inputs.forEach(input => {
        formData[toCamelCase(input.name)] = input.value;
        if (!validateString(input.value) && !input.name.includes('password')) {
            document.getElementById(input.name).classList.add('input-error');
            validLength = false;
        }
    });

    // Check if password is valid
    if (!validatePassword(formData.password)) {
        // Display error message if password is invalid
        const errorMessage = document.getElementById('error-message');

        errorMessage.innerText = "Password must contain 1 [A-Z], 1 [a-z], 1 [0-9], 1 special character, and be 8-16 characters long.";
        errorMessage.classList.remove('hidden');
        document.getElementById('password').classList.add('input-error');
        return;
    } else if (formData.password !== formData.confirmPassword) {
        // Display error message if password and confirm password do not match
        const errorMessage = document.getElementById('error-message');

        errorMessage.innerText = "Passwords do not match.";
        errorMessage.classList.remove('hidden');
        document.getElementById('password').classList.add('input-error');
        document.getElementById('confirm-password').classList.add('input-error');
        return;
    } else if (!validLength) {
        const errorMessage = document.getElementById('error-message');

        errorMessage.innerText = "Fields must be less than 50 characters.";
        errorMessage.classList.remove('hidden');
        return;
    } else {
        // Clear error message if password is valid
        document.getElementById('error-message').classList.add('hidden');
        inputs.forEach(input => {
            document.getElementById(input.name).classList.remove('input-error');
        });
    }

    // Send a POST request to the backend
    fetch(`${config.address}/signup`, {
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
                res.json().then(data => {
                    const errorMessage = document.getElementById('error-message');
                    errorMessage.classList.remove('hidden');

                    if (data.message.includes('email')) {
                        errorMessage.innerText = "Email already exists.";
                        document.getElementById('email').classList.add('input-error');
                    } else {
                        errorMessage.innerText = "Username already exists.";
                        document.getElementById('username').classList.add('input-error');
                    }
                });
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