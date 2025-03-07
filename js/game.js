// Configuration and Global Variables
const address = "http://localhost:3000";
const socket = new WebSocket('ws://localhost:3000');

// Game State Variables
let currentStep = 0;
let guessesLeft = 4;
let startTime = 50; // Initial time for video/audio
let audio_duration = 30; // Audio duration in seconds
let canBePlayed = false;

// Track Information Variables
let trackArtist = "The Weeknd";
let releaseDate = "2025-01-31";
let trackImage = "https://i.scdn.co/image/ab67616d0000b2737e7f1d0bdb2bb5a2afc4fb25";
let trackName = "Cry for Me";
let urlYouTube = "https://www.youtube.com/watch?v=bn8gP5N8hqM";
let player;

// DOM Element References
const elements = [
    document.getElementById('track-year'),
    document.getElementById('track-image'),
    document.getElementById('track-artist')
];
const attemptBoxes = document.querySelectorAll('.attempt-box');

// WebSocket Event Listeners
socket.addEventListener('open', function (event) {
    console.log('Connected to WebSocket server');
});

socket.addEventListener('message', function (event) {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
        showMessages([data.message]);
    } else if (data.type === 'guessed') {
        showGuessed([data.guessed]);
    }
});

//TODO: event listener that recives some message and plays/stops music
/* this is just a draft I havent tested it yet, if it works we have to deactivate the possibility to play music with the play button */
socket.addEventListener('play', function (event) {
    const data = JSON.parse(event.data);
    if (data.type === 'play') {
        togglePlayPause();
    }
});

socket.addEventListener('stop', function (event){
    const data = JSON.parse(event.data);
    if (data.type === 'stop') {
        togglePlayPause();
    }
});

// TODO: music information should be send through websockets instead of using API calls

//TODO: fetch users from lobby and show them in the leaderboard
// delet when they leave the lobby
// update when they change their points
// add when they join the lobby


// Track Information Functions
function updateTrackInfo(artist, releaseDate, coverUrl, name, trackAudioBase64) {
    // Update global track variables
    trackArtist = artist;
    trackName = name;
    trackImage = coverUrl;
    releaseDate = releaseDate;

    // Update DOM elements
    const trackArtistElem = document.getElementById('track-artist');
    trackArtistElem.textContent = `Artist: ${artist}`;

    const trackYearElem = document.getElementById('track-year');
    const formattedDate = new Date(releaseDate).toLocaleDateString('en-GB');
    trackYearElem.textContent = `Release date: ${formattedDate}`;

    const trackImageElem = document.getElementById('track-image');
    trackImageElem.src = coverUrl;

    const audioPlayerElem = document.getElementById('audio-player');
    audioPlayerElem.src = `data:audio/mp3;base64,${trackAudioBase64}`;
    audioPlayerElem.load();
    //audioPlayerElem.oncanplaythrough;
    //audioPlayerElem.oncanplay;
}

function revealNextTrackElement() {
    if (currentStep < elements.length) {
        elements[currentStep].classList.remove('hidden');
        currentStep++;
    }
}

/* FUNCTIONS FROM THE YOUTUBE API

Player Control Functions
function onPlayerReady(event) {
    console.log('Player is ready!');
    event.target.seekTo(startTime);
}

function onPlayerStateChange(event) {
    const state = event.data;
    console.log('Player state changed:', state);
    const playButtonIcon = document.getElementById('play-icon');

    if (state === YT.PlayerState.PLAYING) {
        console.log('Video is playing');
    } else if (state === YT.PlayerState.PAUSED) {
        console.log('Video is paused');
        playButtonIcon.src = '../img/play.fill.png';
        event.target.seekTo(startTime);
    }
}*/

function togglePlayPause() {
    const playButtonIcon = document.getElementById('play-icon');
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer && canBePlayed) {
        if (audioPlayer.paused && canBePlayed) {
            audioPlayer.currentTime = startTime;
            audioPlayer.play();
            playButtonIcon.src = '../img/pause.fill.png';
            updateProgress();
            setTimeout(() => {
                audioPlayer.pause();
                playButtonIcon.src = '../img/play.fill.png';
                audioPlayer.currentTime = startTime;
            }, audio_duration * 1000);
        } else {
            audioPlayer.pause();
            playButtonIcon.src = '../img/play.fill.png';
            audioPlayer.currentTime = startTime;
        }
    } else {
        alert("The audio is not ready to play");
        console.log('Audio player is not initialized yet');
    }
}

// Game Input and Validation Functions
function checkUserInput(userInput) {
    const currentTrack = trackName.trim();

    if (userInput == "") {
        userInput = "Skipped";
    }

    if (userInput.toLowerCase() !== currentTrack.toLowerCase()) {
        
        //TODO: this works now but should be changed to be done with websockets
        showMissed(["username has guessed the track"]);
        
        attemptBoxes[currentStep].style.backgroundColor = 'red';
        updateUserAttempts('Username3', 'miss', currentStep);

        revealNextTrackElement();
        socket.send(JSON.stringify({ type: 'message', data: userInput }));
    } else {

        //TODO: this works now but should be changed to be done with websockets
        showGuessed(["username has guessed the track"]);
       
       
        //this shoulde done also with websockets
        updateUserPoints("Username3", 100);
        updateUserAttempts('Username3', 'guessed', currentStep);
        attemptBoxes[currentStep].style.backgroundColor = '#4CAF50';
        
        guessesLeft = 0; 
        socket.send(JSON.stringify({ type: 'guessed', data: "username has guessed the track" }));
    }
}

// Chat and Leaderboard Functions
function showMessages(messages) {
    const chatMessages = document.querySelector('.chat-messages');
    messages.forEach(message => {
        const messageItem = document.createElement('div');
        messageItem.classList.add('message-sent');
        messageItem.textContent = message;
        chatMessages.appendChild(messageItem);
    });
    scrollToBottom(); // Scroll to the bottom after adding new messages
}

function showGuessed(guesses) {
    const chatMessages = document.querySelector('.chat-messages');
    guesses.forEach(guess => {
        const messageItem = document.createElement('div');
        messageItem.classList.add('message-correct');
        messageItem.textContent = guess;
        chatMessages.appendChild(messageItem);
    });
    scrollToBottom(); // Scroll to the bottom after adding new messages
}

function showMissed(guesses) {
    const chatMessages = document.querySelector('.chat-messages');
    guesses.forEach(guess => {
        const messageItem = document.createElement('div');
        messageItem.classList.add('message-incorrect');
        messageItem.textContent = guess;
        chatMessages.appendChild(messageItem);
    });
    scrollToBottom(); // Scroll to the bottom after adding new messages
}

function scrollToBottom() {
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showUsersWithLeaderboard(users) {
    const leaderboardList = document.querySelector('.leaderboard-list');
    leaderboardList.innerHTML = ''; // Clear existing leaderboard

    users.forEach(user => {
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

        const apointsElem = document.createElement('p');
        apointsElem.classList.add('apoints');
        apointsElem.textContent = ''; // Empty at the start

        userInfo.appendChild(usernameElem);
        userInfo.appendChild(pointsElem);
        userInfo.appendChild(apointsElem);

        const attemptsElem = document.createElement('div');
        attemptsElem.classList.add('attempts-leaderboard');

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
}

function updateUserPoints(username, pointsToAdd) {
    const userRows = document.querySelectorAll('.user-row');
    userRows.forEach(row => {
        const usernameElem = row.querySelector('.username');
        if (usernameElem && usernameElem.textContent === username) {
            const pointsElem = row.querySelector('.points');
            if (pointsElem) {
                const currentPoints = parseInt(pointsElem.textContent, 10);
                const newPoints = currentPoints + pointsToAdd;
                pointsElem.textContent = newPoints;
            }
        }
    });
}

function updateUserAPoints(username, additionalPoints) {
    const userRows = document.querySelectorAll('.user-row');
    userRows.forEach(row => {
        const usernameElem = row.querySelector('.username');
        if (usernameElem && usernameElem.textContent === username) {
            const apointsElem = row.querySelector('.apoints');
            if (apointsElem) {
                apointsElem.textContent = `+ ${additionalPoints}`;
            }
        }
    });
}


// Function to update the progress bar
function updateProgress() {
    const audioPlayer = document.getElementById('audio-player');
    const progressSlider = document.getElementById('audio-progress');
    if (audioPlayer && !audioPlayer.paused) {
        progressSlider.value = (audioPlayer.currentTime - startTime)/audio_duration * 100;
        requestAnimationFrame(updateProgress);
    }
}

// TODO: this function should be called when users sends miss/guessed message
// Function to update the leaderboard attempts
function updateUserAttempts(username, state, currentInput) {
    const userRows = document.querySelectorAll('.user-row');
    userRows.forEach(row => {
        const usernameElem = row.querySelector('.username');
        if (usernameElem && usernameElem.textContent.trim() === username) {
            const attemptBoxes = row.querySelectorAll('.attempts .attempt-box');

            attemptBoxes.forEach((box, index) => {
                if (index < currentInput) {
                    box.classList.add('attempt-box-incorrect');

                } else if (index === currentInput) {
                    if (state === 'guessed') {
                        box.classList.add('attempt-box-correct');
                    }
                    else if (state === 'miss') {
                        box.classList.add('attempt-box-incorrect');
                    } 
                }
            });
        }
    });
}

function resetUserAttempts() {
    const userRows = document.querySelectorAll('.user-row');
    userRows.forEach(row => {
        const attemptBoxes = row.querySelectorAll('.attempt-box');
        attemptBoxes.forEach(box => {
            box.classList.remove('attempt-box-correct', 'attempt-box-incorrect');
        });
    });
}

// Event Listeners
document.getElementById('show-elements-btn').addEventListener('click', function() {
    if (guessesLeft > 0) {  
        checkUserInput("");
        guessesLeft--;
    }
});

document.getElementById('shuffle-btn').addEventListener('click', function() {
    const errorContainer = document.querySelector('.error-container');
    errorContainer.innerHTML = '';

    currentStep = 0;
    guessesLeft = 4;
    resetUserAttempts();

    elements.forEach(element => element.classList.add('hidden'));
    attemptBoxes.forEach(box => box.style.backgroundColor = '');

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

document.getElementById('play-btn').addEventListener('click', togglePlayPause);

document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && guessesLeft > 0) {
        event.preventDefault();
        const userInput = event.target.value.trim();
        checkUserInput(userInput);
        guessesLeft--;
        event.target.value = "";
    }
});

document.getElementById('message-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const userInput = event.target.value.trim();
        if (userInput !== ""){

            
            // TODO: this has to be shown with websockets implementation, now its just for demonstration
            socket.send(JSON.stringify({ type: 'message', data: userInput }));

            showMessages([`username: ${userInput}`]);
            event.target.value = "";
        }
       
    }
});

document.getElementById('send-btn').addEventListener('click', function(event) {
    const messageInput = document.getElementById('message-input');
    const userInput = messageInput.value.trim();

    if (userInput !== ""){
        socket.send(JSON.stringify({ type: 'message', data: userInput }));

        // TODO: this has to be shown with websockets implementation, now its just for demonstration
        socket.send(JSON.stringify({ type: 'message', data: userInput }));

        showMessages([`username: ${userInput}`]);
        event.target.value = "";
    }

});

// Initial Setup
updateTrackInfo(trackArtist, releaseDate, trackImage, trackName, urlYouTube);

//TODO: event listener onplaythrough that sends a message to the server that users can play the music
document.getElementById("audio-player").oncanplaythrough = function() {
   
    canBePlayed = true;
    alert("The audio is ready to play (oncanplaythrough)");
    //TODO: send a message to the server that users can play the music
    //socket.send(JSON.stringify({ type: 'play' }));
};

document.getElementById("audio-player").oncanplay = function() {
   
    canBePlayed = true;
    alert("The audio is ready to play(oncanplay)");
    //TODO: send a message to the server that users can play the music
    //socket.send(JSON.stringify({ type: 'play' }));
};

// Page Load Example Data
document.addEventListener('DOMContentLoaded', () => {
    showMessages(["username1: Hello, how are you?","username2: I'm good, thanks! How about you?","username3:I'm doing great, just waiting for the game to start!"]);   
    showMissed(['username1 missed the track',"username2 missed the track"]);
    showGuessed(['username1 guessed the track']);

    const users = [
        { username: 'Username', points: 100, attempts: 4 },
        { username: 'Username2', points: 80, attempts: 4 },
        { username: 'Username3', points: 65, attempts: 4 },
        { username: 'Username3', points: 90, attempts: 4 },
        { username: 'Username4', points: 25, attempts: 4 },
        { username: 'Username6', points: 40, attempts: 4 },
        { username: 'Username4', points: 95, attempts: 4 },
        { username: 'Username6', points: 55, attempts: 4 },
    ];

    

    showUsersWithLeaderboard(users);

    let gameProgress = 50;
    const progressSlider = document.getElementById('game-progress');
    progressSlider.value = gameProgress;
});