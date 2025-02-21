const address = "http://localhost:3000"

/* Function triggered on page load, to check we have access to the page */
document.addEventListener('DOMContentLoaded', function() {
	// Get the 'username' parameter from the URL
	const urlParams = new URLSearchParams(window.location.search);
	const decodedUsername = decodeURIComponent(urlParams.get('username'));

    var finalAddress;

    if (decodedUsername !== 'null') finalAddress = `${address}/profile/${decodedUsername}`;     // 'null' between quotes because javascript is absolute trash and can't return null of correct type
    else finalAddress = `${address}/profile/`;

    // Get the JWT token from local storage
    const token = localStorage.getItem('jwtToken');

	// Request profile info for the username
	fetch(finalAddress, {
		method: 'GET',
		headers: {
            'Content-Type': 'application/json', // Important for JSON payload
            'Authorization': `Bearer ${token}` // Send the JWT token in the header
        }
	})
	.then(response => {
        switch (response.status) {
            case 200:
                // If request is successful, remove 'hidden' class to reveal the body
				document.body.classList.remove('hidden');
				console.log(response);
            default:
                // Handle other error responses (e.g., 400, 500, etc.)
                response.json().then(data => {
                    sessionStorage.setItem('httpStatus', response.status);
                    sessionStorage.setItem('customMessage', data.message);
                });
                // Redirect to error-template.html upon error
                // window.location.href = 'error-template.html';
                break;
        }
	});
});