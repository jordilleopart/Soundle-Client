const address = "http://localhost:3000";
let currentStep = 0;

// Global variables for track information (predetermined values)
let trackArtist = "The Weeknd";
let releaseDate = "2025-01-31";
let trackImage = "https://i.scdn.co/image/ab67616d0000b2737e7f1d0bdb2bb5a2afc4fb25";
let trackName = "Cry for Me";
let urlYouTube = "https://www.youtube.com/watch?v=bn8gP5N8hqM";
let player;

let startTime = 50; // Guardamos el tiempo inicial en el que comienza el video
let audio_duration = 10 //audio duration in seconds

// Elements to be displayed in sequence
const elements = [
    document.getElementById('track-year'),
    document.getElementById('track-image'),
    document.getElementById('track-artist'),
];
const attemptBoxes = document.querySelectorAll('.attempt-box');

// Function to update global track variables and update the HTML content
function updateTrackInfo(artist, date, image, name, youtubeUrl) {
    trackArtist = artist;
    releaseDate = date;
    trackImage = image;
    trackName = name;
    urlYouTube = youtubeUrl;

    // Format the release date to display only the date
    const formattedDate = new Date(releaseDate).toLocaleDateString('en-GB'); // 'en-GB' for day/month/year format

    // Update the track information in the UI (but keep the image hidden)
    document.getElementById('track-artist').textContent = `Artist: ${trackArtist}`;
    document.getElementById('track-year').textContent = `Release date: ${formattedDate}`;
    document.getElementById('track-image').src = trackImage;

    // Extract YouTube video ID and update the embedded player
    const videoId = extractYouTubeId(urlYouTube);
    updateYouTubePlayer(videoId);
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
    checkUserInput("");
});

// Event listener for fetching a random track from the server
document.getElementById('shuffle-btn').addEventListener('click', function() {
    // Clear any existing error messages before fetching new track data
    const errorContainer = document.querySelector('.error-container');
    errorContainer.innerHTML = ''; // This removes all error messages

    // Reset the currentStep to 0 to start the track element sequence from the beginning
    currentStep = 0;

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
            data.track_preview_url   
        );
    })
    .catch(error => console.error('Error fetching data:', error));
});

//We dont need this if we pass the ID instead of the URL on the API call
//Function to extract the YouTube video ID from a given URL
function extractYouTubeId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Function to update the YouTube iframe with the new video ID
function updateYouTubePlayer(videoId) {
    if (videoId) {
        document.getElementById('player').src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    }
}


// This function is called by the YouTube IFrame API when it's ready
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}


// This function is called when the player is ready
function onPlayerReady(event) {
    console.log('Player is ready!');
    event.target.seekTo(startTime); // Comienza el video en el segundo 30
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
    if (player) {
        if (player.getPlayerState() === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
            // Change the icon to pause when the video starts playing
            playButtonIcon.src = '../img/pause.fill.png';
            // Set a timeout to pause the video after 6 seconds
            setTimeout(() => {
                player.pauseVideo();
                playButtonIcon.src = '../img/play.fill.png'; // Change icon back to play
                // Revert the video to the start time (second 30) after pausing
                player.seekTo(startTime);
            }, audio_duration*1000); // Pausa después de x segundos
        }
    } else {
        console.log('Player is not initialized yet');
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
        errorBox.classList.add('error-box');
        errorBox.textContent = userInput;
        document.querySelector('.error-container').appendChild(errorBox);
        attemptBoxes[currentStep].style.backgroundColor = 'red';

        // Reveal next track element when the user fails
        revealNextTrackElement();
    } else {
        const correctBox = document.createElement('div');
        correctBox.classList.add('correct-box');
        correctBox.textContent = trackName;
        document.querySelector('.error-container').appendChild(correctBox);
        attemptBoxes[currentStep].style.backgroundColor = '#4CAF50';
    }
}

// Event listener for the Enter key to submit user input
document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const userInput = event.target.value.trim();
        checkUserInput(userInput);
        event.target.value = ""; // Clean input
    }
});

// Call updateTrackInfo() on page load to ensure initial values are stored
updateTrackInfo(trackArtist, releaseDate, trackImage, trackName, urlYouTube);

