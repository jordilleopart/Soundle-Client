// Select relevant DOM elements
const sendButton = document.querySelector('.chat-input button');
const chatMessages = document.querySelector('.chat-messages');
const inputField = document.querySelector('.chat-input input');

// Function to handle sending messages
sendButton.addEventListener('click', function() {
    const messageText = inputField.value.trim(); // Get and clean the input

    // Check if the input is not empty
    if (messageText !== "") {
        // Create a new message element
        chat.sendMessage({type: "chat", author: localStorage.getItem('username'), content: messageText});
        // reset input
        inputField.value = "";
    }
});

// Optional: Allow pressing "Enter" to send a message
inputField.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendButton.click();
    }
});

function fillLobbyData(data) {
    console.log(data)
    // Update the titles
    const pageTitle = document.querySelector('title');
    pageTitle.innerText = `Soundle - ${data.gameInfo.user_name}'s game`;

    const gameTitleElement = document.getElementById('game-title');
    gameTitleElement.textContent = data.gameInfo.game_id;

    // Update the author
    const gameAuthorElement = document.getElementById('game-creator');
    gameAuthorElement.textContent = `by ${data.gameInfo.user_name}`;

    // Update the number of users in the room
    const usersCountElement = document.getElementById('users-count');
    const currentUsers = data.gameInfo.num_players;  // Assuming this value comes from the backend
    const maxPlayers = data.gameInfo.max_players;

    usersCountElement.textContent = `${currentUsers}/${maxPlayers}`;  // Update users in the format users/maxPlayers
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
                    chat.connectToLobby(lobbyId);
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