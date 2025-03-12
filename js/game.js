var lobbyId = undefined;
const chatInput = document.querySelector('.chat-input input');
const sendButton = document.getElementById('send-btn');

// Event Listeners
document.getElementById('show-elements-btn').addEventListener('click', function() {
    if (game.guessesLeft > 0) {  
        game.checkUserInput("");
        game.guessesLeft--;
    }
});

document.getElementById('play-btn').addEventListener('click', game.togglePlayPause);

document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && game.guessesLeft > 0) {
        event.preventDefault();
        const userInput = event.target.value.trim();
        game.checkUserInput(userInput);
        game.guessesLeft--;
        event.target.value = "";
    }
});

sendButton.addEventListener('click', function() {
    const userInput = chatInput.value.trim();
    if (userInput !== ""){
        // Create a new message element
        chat.sendMessage(JSON.stringify({type: "chat", author: localStorage.getItem('username'), content: userInput}));
        // reset input
        chatInput.value = "";
    }
});

chatInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendButton.click();
    }
});

function getRandomTrack() {
    const token = localStorage.getItem('jwtToken');
    fetch(`${config.address}/track/random`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.status === 200) return response.json();
        return response.json().then(data => {
            sessionStorage.setItem('httpStatus', response.status);
            sessionStorage.setItem('customMessage', data.message);
            // Redirect to error-template.html upon error
            window.location.href = 'error-template.html';
        });
    })
    .then(data => {
        console.log(data)
        chat.sendMessage(JSON.stringify({type: "track", trackInfo: data}));
    })
    .catch(error => console.error('Error fetching data:', error));
};

// Page Load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
	lobbyId = urlParams.get('gameId');

    chat.connectToLobby(lobbyId);

    if (localStorage.getItem('master') === localStorage.getItem('username')) getRandomTrack();

    // Play music on load
    setTimeout(() => {
        game.togglePlayPause();
    }, 1000);
});