const address = "http://localhost:3000";
const socket = new WebSocket('ws://localhost:3000');
let currentStep = 0;

// Global variables for track information (predetermined values)
let trackArtist = "The Weeknd";
let releaseDate = "2025-01-31";
let trackImage = "https://i.scdn.co/image/ab67616d0000b2737e7f1d0bdb2bb5a2afc4fb25";
let trackName = "Cry for Me";
let urlYouTube = "https://www.youtube.com/watch?v=bn8gP5N8hqM";
let player;

let startTime = 50; // Store the initial time at which the video starts
let audio_duration = 10 // audio duration in seconds
var guessesLeft = 4;

// Elements to be displayed in sequence
const elements = [
    document.getElementById('track-year'),
    document.getElementById('track-image'),
    document.getElementById('track-artist'),
];
const attemptBoxes = document.querySelectorAll('.attempt-box');

// Function to update global track variables and update the HTML content
function updateTrackInfo(artist, releaseDate, coverUrl, name, trackAudioBase64) {
    // Update global variables
    trackArtist = artist;
    trackName = name;
    trackImage = coverUrl;
    releaseDate = releaseDate;

    // Update track artist
    const trackArtistElem = document.getElementById('track-artist');
    trackArtistElem.textContent = `Artist: ${artist}`;
    //trackArtistElem.classList.remove('hidden');

    // Update track release date
    const trackYearElem = document.getElementById('track-year');
    const formattedDate = new Date(releaseDate).toLocaleDateString('en-GB'); // 'en-GB' for day/month/year format
    trackYearElem.textContent = `Release date: ${formattedDate}`;
    //trackYearElem.classList.remove('hidden');

    // Update track cover image
    const trackImageElem = document.getElementById('track-image');
    trackImageElem.src = coverUrl;
    //trackImageElem.classList.remove('hidden');

    // Update audio player source
    const audioPlayerElem = document.getElementById('audio-player');
    audioPlayerElem.src = `data:audio/mp3;base64,${trackAudioBase64}`;
    audioPlayerElem.load(); // Reload the audio element to apply the new source
}

// Function to reveal the next track element
function revealNextTrackElement() {
    if (currentStep < elements.length) {
        elements[currentStep].classList.remove('hidden');
        currentStep++;
    }
}

// Event listener to progressively reveal track elements
document.getElementById('show-elements-btn').addEventListener('click', function() {
    if (guessesLeft > 0) {  
        checkUserInput("");
        guessesLeft--;
    }
    
});

// Event listener for fetching a random track from the server
document.getElementById('shuffle-btn').addEventListener('click', function() {
    // Clear any existing error messages before fetching new track data
    const errorContainer = document.querySelector('.error-container');
    errorContainer.innerHTML = ''; // This removes all error messages

    // Reset the currentStep to 0 to start the track element sequence from the beginning
    currentStep = 0;
    guessesLeft = 4;

    // Hide all elements initially before revealing them again
    elements.forEach(element => element.classList.add('hidden'));
    attemptBoxes.forEach(box => box.style.backgroundColor = ''); // Reset the background color

    const token = localStorage.getItem('jwtToken');
    fetch(`${address}/track/random`, {
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
            throw new Error('Error fetching track data');
        });
    })
    .then(data => {
        // Adapt the response to match the expected format
        updateTrackInfo(
            data.track_artist,         
            data.track_release_date,   
            data.track_cover_url,      
            data.track_name,           
            data.track_audio_path
        );
    })
    .catch(error => console.error('Error fetching data:', error));
});



// This function is called when the player is ready
function onPlayerReady(event) {
    console.log('Player is ready!');
    event.target.seekTo(startTime); // Start the video at the 30th second
}

// This function is called when the player state changes (e.g., play, pause, etc.)
function onPlayerStateChange(event) {
    const state = event.data;
    console.log('Player state changed:', state);
    const playButtonIcon = document.getElementById('play-icon');

    if (state === YT.PlayerState.PLAYING) {
        console.log('Video is playing');
    } else if (state === YT.PlayerState.PAUSED) {
        console.log('Video is paused');
        // Change the icon back to play when the video is paused
        playButtonIcon.src = '../img/play.fill.png';
        // Revert the video to the start time (second 30) when it is paused
        event.target.seekTo(startTime);
    }
}

// Function to toggle play/pause
function togglePlayPause() {
    const playButtonIcon = document.getElementById('play-icon');
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer) {
        if (audioPlayer.paused) {
            audioPlayer.play();
            // Change the icon to pause when the audio starts playing
            playButtonIcon.src = '../img/pause.fill.png';
            // Set a timeout to pause the audio after x seconds
            setTimeout(() => {
                audioPlayer.pause();
                playButtonIcon.src = '../img/play.fill.png'; // Change icon back to play
                // Revert the audio to the start time (second 30) after pausing
                audioPlayer.currentTime = startTime;
            }, audio_duration * 1000); // Pause after x seconds
        } else {
            audioPlayer.pause();
            // Change the icon back to play when the audio is paused
            playButtonIcon.src = '../img/play.fill.png';
            // Revert the audio to the start time (second 30) when it is paused
            audioPlayer.currentTime = startTime;
        }
    } else {
        console.log('Audio player is not initialized yet');
    }
}

// Modify the event listener for the play button
document.getElementById('play-btn').addEventListener('click', function () {
    togglePlayPause();
});

// Function to check user input
function checkUserInput(userInput) {
    const currentTrack = trackName.trim();

    if (userInput == "") {
        userInput = "Skipped";
    }

    if (userInput.toLowerCase() !== currentTrack.toLowerCase()) {
        const errorBox = document.createElement('div');
        
        //this would be needed when all is connected to the websocket
        errorBox.classList.add('error-box');
        errorBox.textContent = userInput;
        document.querySelector('.error-container').appendChild(errorBox);
        attemptBoxes[currentStep].style.backgroundColor = 'red';

        // Reveal next track element when the user fails
        revealNextTrackElement();

        //TODO: SEND MESSAGE TO SERVER
        socket.send(JSON.stringify({ type: 'message', data: userInput }));

    } else {

        //this would be needed when all is connected to the websocket
        const correctBox = document.createElement('div');
        correctBox.classList.add('correct-box');
        correctBox.textContent = trackName;
        document.querySelector('.error-container').appendChild(correctBox);
        attemptBoxes[currentStep].style.backgroundColor = '#4CAF50';
        
        // Stop the game when the user guesses correctly
        guessesLeft = 0; 

        //TODO: SEND GUESSED TO SERVER
        socket.send(JSON.stringify({ type: 'guessed', data: "username has guessed the track" })); //this has to be change to add the username dyanmically
    }
}


// WebSocket event listeners
socket.addEventListener('open', function (event) {
    console.log('Connected to WebSocket server');
});

socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
        showMessages([data.message]);
    }
    else if (data.type === 'guessed') {
        showGuessed([data.guessed]);
    }
});

function showMessages(messages) {
    const chatMessages = document.querySelector('.chat-messages');
    messages.forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.classList.add('message-sent');
        messageItem.textContent = message;
        chatMessages.appendChild(messageItem);
    });
}

function showGuessed(guesses) {
    const chatMessages = document.querySelector('.chat-messages');
    guesses.forEach(guess => {
        const messageItem = document.createElement('div');
        messageItem.classList.add('message-correct');
        messageItem.textContent = guess;
        chatMessages.appendChild(messageItem);
    });
}


// Event listener for the Enter key to submit user input
document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && guessesLeft > 0) {
        event.preventDefault();
        const userInput = event.target.value.trim();
        checkUserInput(userInput);
        guessesLeft--;
        event.target.value = ""; // Clean input
    }
});

// Call updateTrackInfo() on page load to ensure initial values are stored
updateTrackInfo(trackArtist, releaseDate, trackImage, trackName, urlYouTube);

// Function to add a user to the leaderboard
function showUsersWithLeaderboard(users) {
    const leaderboardList = document.querySelector('.leaderboard-list');
    const userList = document.createElement('div');
    userList.classList.add('user-list');

    users.forEach(user => {
        // Create user item for chat
        const userItem = document.createElement('div');
        userItem.classList.add('user-item');
        userItem.textContent = user.username;
        userList.appendChild(userItem);

        // Create user row for leaderboard
        const userRow = document.createElement('div');
        userRow.classList.add('user-row');

        const profilePic = document.createElement('img');
        profilePic.src = "../img/person.crop.circle.fill-grey.png";
        profilePic.alt = user.username;
        profilePic.classList.add('profile-pic');

        const userDetails = document.createElement('div');
        userDetails.classList.add('user-details');

        const userInfo = document.createElement('div');
        userInfo.classList.add('user-info');

        const usernameElem = document.createElement('p');
        usernameElem.classList.add('username');
        usernameElem.textContent = user.username;

        const pointsElem = document.createElement('p');
        pointsElem.classList.add('points');
        pointsElem.textContent = user.points;

        userInfo.appendChild(usernameElem);
        userInfo.appendChild(pointsElem);

        const attemptsElem = document.createElement('div');
        attemptsElem.classList.add('attempts');

        for (let i = 0; i < user.attempts; i++) {
            const attemptBox = document.createElement('div');
            attemptBox.classList.add('attempt-box');
            attemptsElem.appendChild(attemptBox);
        }

        userDetails.appendChild(userInfo);
        userDetails.appendChild(attemptsElem);

        userRow.appendChild(profilePic);
        userRow.appendChild(userDetails);

        leaderboardList.appendChild(userRow);
    });

    chatPanel.appendChild(userList);
}

// Function to update user points in the leaderboard
function updateUserPoints(username, newPoints) {
    const userRows = document.querySelectorAll('.user-row');
    userRows.forEach(row => {
        const usernameElem = row.querySelector('.username');
        if (usernameElem && usernameElem.textContent === username) {
            const pointsElem = row.querySelector('.points');
            if (pointsElem) {
                pointsElem.textContent = newPoints;
            }
        }
    });
}

function updateAttempts(username, attempts) {
    const userRows = document.querySelectorAll('.user-row');
    userRows.forEach(row => {
        const usernameElem = row.querySelector('.username');
        if (usernameElem && usernameElem.textContent === username) {
            const attemptsElems = row.querySelectorAll('.attempt-box');
            attemptsElems.forEach((attemptElem, index) => {
                if (index < attempts.correct) {
                    attemptElem.classList.add('correct-box');
                    attemptElem.classList.remove('error-box');
                } else if (index < attempts.correct + attempts.incorrect) {
                    attemptElem.classList.add('error-box');
                    attemptElem.classList.remove('correct-box');
                } else {
                    attemptElem.classList.remove('correct-box', 'error-box');
                }
            });
        }
    });
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
    const users = [
        { username: 'Username', points: 100, attempts: 0 },
        { username: 'Username2', points: 80, attempts: 0 },
        { username: 'Username3', points: 65, attempts: 0 },
        { username: 'Username3', points: 90, attempts: 0 },
        { username: 'Username4', points: 25, attempts: 0 },
        { username: 'Username6', points: 40, attempts: 0 },
        { username: 'Username4', points: 95, attempts: 0 },
        { username: 'Username6', points: 55, attempts: 0 },
    ];
    showUsersWithLeaderboard(users);
    
    
    

    // Assuming you have a global variable for game progress
    let gameProgress = 50; // Example value
    const progressSlider = document.getElementById('game-progress');
    progressSlider.value = gameProgress;
});


/* Funtions needed for the websocket implementation
showUsers()
showMessages()
sendMessage()



// Function to show users in the chat
function showUsers(users) {
    const chatPanel = document.querySelector('.chat-panel');
    const userList = document.createElement('div');
    userList.classList.add('user-list');
    users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.classList.add('user-item');
        userItem.textContent = user;
        userList.appendChild(userItem);
    });
    chatPanel.appendChild(userList);
}
*/




