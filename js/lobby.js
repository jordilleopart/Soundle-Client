function fillLobbyData(data) {
    console.log(data)
    // Update the title
    const gameTitleElement = document.getElementById('game-title');
    gameTitleElement.textContent = data.gameInfo.game_id;

    // Update the author
    const gameAuthorElement = document.getElementById('game-creator');
    gameAuthorElement.textContent = `by ${data.gameInfo.user_name}`;
}

/* Function triggered on page load, to check we have access to the page */
document.addEventListener('DOMContentLoaded', function() {
    // Get the JWT token from local storage
    const token = localStorage.getItem('jwtToken');

    const urlParams = new URLSearchParams(window.location.search);
	const lobbyId = urlParams.get('gameId');

    fetch(`${config.address}/game/lobby?gameId=${lobbyId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json', // Important for JSON payload
            'Authorization': `Bearer ${token}` // Send the JWT token in the header
        }
    })
    .then(response => {
        switch (response.status) {
            case 200:
                response.json().then(data => {
                    // Replace placeholders with actual values
                    fillLobbyData(data);

                    // connect to websocket (chat)
                    window.WebSocketManager.connect(lobbyId);
                })
                break;
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
    .catch(error => {
        // Handle error parsing json
        sessionStorage.setItem('httpStatus', 500);
        sessionStorage.setItem('customMessage', "Internal Server Error");
        // Redirect to error-template.html upon error
        window.location.href = 'error-template.html';
    });

});