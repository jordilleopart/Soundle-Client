// Function to get all URL parameters as an object
function getUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    for (const [key, value] of params) {
        result[key] = value;
    }
    
    return result;
}

// Select all the links with the class 'playlist' and 'other-playlist'
const playlists = document.querySelectorAll('.playlist, .other-playlist');

// Add a click event listener to each link
playlists.forEach(playlist => {
    playlist.addEventListener('click', function(event) {
        // Prevent the default link behavior (navigating to the href)
        event.preventDefault();

        // Retrieve the text content of the link (anchor tag)
        const playlistText = playlist.textContent.trim();

        // Access values of url params
        const urlParams = getUrlParameters();
        const participants = urlParams['participants'];
        const gameType = urlParams['type'];
        const rounds = urlParams['rounds'];

        // Get the JWT token from local storage
        const token = localStorage.getItem('jwtToken');

        // Create the payload to send to the back-end
        const payload = {
            maxPlayers: participants,
            gameType: gameType,
            rounds: rounds,
            playlist: playlistText // Add the link text in the request body
        };

        // Send request to back-end to create the game
        fetch(`${config.address}/game/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Important for JSON payload
                'Authorization': `Bearer ${token}` // Send the JWT token in the header
            },
            body: JSON.stringify(payload) // Send the payload in the request body
        })
        .then(response => {
            switch (response.status) {
                case 200:
                    return response.json();
                default:
                    // Handle other error responses (e.g., 400, 401, 403, etc.)
                    response.json().then(data => {
                        sessionStorage.setItem('httpStatus', response.status);
                        sessionStorage.setItem('customMessage', data.message);
                    });
                    // Redirect to error-template.html upon error
                    window.location.href = 'error-template.html';
                    break;
            }
        })
        .then(jsonData => {

            // creation of game was succesful, then join game
            fetch(`${config.address}/game/join/${jsonData.gameId}?code=${jsonData.code}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Important for JSON payload
                    'Authorization': `Bearer ${token}` // Send the JWT token in the header
                }
            })
            .then(response => {
                switch (response.status) {
                    case 200:
                        response.json().then(data => {
                            // Move to corresponding lobby
                            window.location.href = `lobby.html?gameId=${data.gameId}`;
                        })
                        break;
                    default:
                        // Handle other error responses (e.g., 422, 500, etc.)
                        response.json().then(data => {
                            sessionStorage.setItem('httpStatus', response.status);
                            sessionStorage.setItem('customMessage', data.message);
                        });
                        // Redirect to error-template.html upon error
                        window.location.href = 'error-template.html';
                        break;
                }
            })
            .catch(error => {
                // Handle error parsing json
                sessionStorage.setItem('httpStatus', 500);
                sessionStorage.setItem('customMessage', "Internal Server Error");
                // Redirect to error-template.html upon error
                window.location.href = 'error-template.html';
            });

        })
        .catch(error => {
            // Handle error parsing json
            sessionStorage.setItem('httpStatus', 500);
            sessionStorage.setItem('customMessage', "Internal Server Error");
            // Redirect to error-template.html upon error
            window.location.href = 'error-template.html';
        });
    });
});
