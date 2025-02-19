const address = "http://localhost:3000"

/* Function triggered on page load, to check it is called with correct query parameters
	and that we have access to the page */
document.addEventListener('DOMContentLoaded', function() {
	// Get the 'username' parameter from the URL
	const urlParams = new URLSearchParams(window.location.search);
	const username = urlParams.get('username');

	// Check if 'username' parameter exists in the URL
	if (username) {
	  	// Get JWT Token from local storage
	  	const jwtToken = localStorage.getItem('jwtToken');

		// Prepare the headers object
		const headers = {
			'Content-Type': 'application/json',
		};
	
		// Conditionally add the Authorization header if the jwtToken exists
		if (jwtToken) headers['Authorization'] = `Bearer ${jwtToken}`;

		// Request profile info for the username
		fetch(`${address}/profile/${username}`, {
			method: 'GET',
			headers: headers,
		})
		.then(response => {
			if (response.ok) {
				return response.json(); // Return parsed JSON if request was successful
			}
			throw new Error(`${response.status}`);
		})
		.then(data => {
			// If request is successful, remove 'hidden' class to reveal the body
			document.body.classList.remove('hidden');
			console.log(data);
		})
		.catch((error) => { // any HTTP response that is not ok
			alert(`${error.message}`);
		});

	} else {
		alert("400 - Bad Request")
	}
});