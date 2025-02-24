let player;

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
}

// This function is called when the player state changes (e.g., play, pause, etc.)
function onPlayerStateChange(event) {
    const state = event.data;
    console.log('Player state changed:', state);
    if (state === YT.PlayerState.PLAYING) {
        console.log('Video is playing');
    } else if (state === YT.PlayerState.PAUSED) {
        console.log('Video is paused');
    }
}

// Toggle play/pause functionality
function togglePlayPause() {
    if (player) {
        if (player.getPlayerState() === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    } else {
        console.log('Player is not initialized yet');
    }
}

document.getElementById('play-btn').addEventListener('click', function () {
    let img = document.getElementById('play-icon');
    
    // Toggle the icon based on the current state
    if (img.src.includes('play.fill.png')) {
        img.src = '../img/pause.fill.png';
    } else {
        img.src = '../img/play.fill.png';
    }
    togglePlayPause();
});