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

// Define the starting time for the timer (in seconds)
let timeLeft = 45; // Example: 45 seconds

// Select the elements for the timer and play button
const timerElement = document.getElementById("timer");

// Function to update the timer display
function updateTimer() {
    // Update the displayed timer
    timerElement.textContent = timeLeft;

    // If time is up, stop the timer
    if (timeLeft <= 0) {
        clearInterval(timerInterval); // Stop the countdown
        console.log("Time's up!");

        game.guessesLeft = 0;

        if (localStorage.getItem('master') === localStorage.getItem('username')) document.getElementById('next-button').classList.remove('hidden');
    }
}


// Page Load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
	lobbyId = urlParams.get('gameId');

    chat.connectToLobby(lobbyId);

    if (localStorage.getItem('master') === localStorage.getItem('username')) getRandomTrack();

    // Play music on load
    setTimeout(() => {
        game.togglePlayPause();
        
        // Start the countdown by updating every second
        timerInterval = setInterval(() => {
            // Decrease the time by 1 second
            timeLeft--;
            updateTimer(); // Update the display with the new time
        }, 1000); // Run the function every 1000 milliseconds (1 second)
    }, 1000);
});

let customLeave = false; // Flag to track if the user clicked the "Next" button

// Function to perform the fetch request when leaving
function performLeaveAction() {
    // Get the JWT token from local storage
    const token = localStorage.getItem('jwtToken');

    fetch(`${config.address}/game/leave/${chat.lobby}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Important for JSON payload
            'Authorization': `Bearer ${token}` // Send the JWT token in the header
        },
        keepalive: true,  // This flag ensures the request is sent even if the page is unloading
    });
}

// Beforeunload event to call the performLeaveAction
window.addEventListener('beforeunload', (event) => {
    // Check if the page is being refreshed by using sessionStorage
    if (!customLeave) {
        performLeaveAction();
    }
});