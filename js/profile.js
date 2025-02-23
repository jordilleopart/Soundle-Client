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
                return response.json();
            default:
                // Handle other error responses (e.g., 400, 500, etc.)
                response.json().then(data => {
                    sessionStorage.setItem('httpStatus', response.status);
                    sessionStorage.setItem('customMessage', data.message);
                });
                // Redirect to error-template.html upon error
                window.location.href = 'error-template.html';
                break;
        }
	})
    .then(userData => {
        // Set the profile information
        fillProfileData(userData);

        // If request is successful, remove 'hidden' class to reveal the body
        document.body.classList.remove('hidden');
    })
    .catch((error) => {
        // Handle error parsing json
        sessionStorage.setItem('httpStatus', 500);
        sessionStorage.setItem('customMessage', "Internal Server Error");
        // Redirect to error-template.html upon error
        window.location.href = 'error-template.html';
    });
});

function fillProfileData(data) {
    // Set the user's full name
    const fullNameElement = document.getElementById('full-name');
    fullNameElement.textContent = `${data.first_name} ${data.last_name}`;

    // Set the username
    const usernameElement = document.getElementById('username');
    usernameElement.textContent = `Username: ${data.user_name}`;

    // Set the email
    const emailElement = document.getElementById('email');
    emailElement.textContent = `Email: ${data.user_email}`;

    // Set the join date (format it in a readable form)
    const joinDateElement = document.getElementById('join-date');
    const joinDate = new Date(data.join_date);
    joinDateElement.textContent = `Member since: ${joinDate.toLocaleDateString()}`;

    // Set the total games played
    const totalGamesElement = document.getElementById('games-played');
    totalGamesElement.textContent = `Total Games Played: ${data.total_games}`;

    // Set the total wins
    const totalWinsElement = document.getElementById('games-won');
    totalWinsElement.textContent = `Total Wins: ${data.total_wins}`;
};