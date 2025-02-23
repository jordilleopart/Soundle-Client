document.addEventListener("DOMContentLoaded", function() {
    const address = "http://localhost:3000";
    let currentStep = 0;

    // Global variables for track information
    let trackArtist = "Frank Ocean";
    let releaseDate = "2016-08-20";
    let trackImage = "https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526";
    let trackName = "Godspeed";
    let urlYouTube = "https://www.youtube.com/watch?v=P18g4rKns6Q";

    // Elements to be displayed in sequence
    const elements = [
        document.getElementById('track-image'), // Album cover (hidden by default)
        document.getElementById('track-year'),
        document.getElementById('track-artist')
    ];
    const attemptBoxes = document.querySelectorAll('.attempt-box');

    // Function to update global track variables and update the HTML content
    function updateTrackInfo(artist, date, image, name, youtubeUrl) {
        trackArtist = artist;
        releaseDate = date;
        trackImage = image;
        trackName = name;
        urlYouTube = youtubeUrl;

        // Update the track information in the UI (but keep the image hidden)
        document.getElementById('track-artist').textContent = `Artist: ${trackArtist}`;
        document.getElementById('track-year').textContent = `Release date: ${releaseDate}`;
        document.getElementById('track-image').src = trackImage;

        // Extract YouTube video ID and update the embedded player
        const videoId = extractYouTubeId(urlYouTube);
        updateYouTubePlayer(videoId);
    }

    function revealNextTrackElement() {
        if (currentStep < elements.length) {
            elements[currentStep].classList.remove('hidden');
            attemptBoxes[currentStep].style.backgroundColor = '#4CAF50';
            currentStep++;
        }
    }

    // Event listener to progressively reveal track elements
    document.getElementById('show-elements-btn').addEventListener('click', function() {
        revealNextTrackElement();
    });
    

    // Event listener for fetching a random track from the server
    document.getElementById('shuffle-btn').addEventListener('click', function() {
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
                data.track_artist,         // Renamed from `artist`
                data.track_release_date,   // Renamed from `release_date`
                data.track_cover_url,      // Renamed from `image_url`
                data.track_name,           // Renamed from `name`
                data.track_preview_url     // Renamed from `video_url`
            );
        })
        .catch(error => console.error('Error fetching data:', error));
    });

    // Function to extract the YouTube video ID from a given URL
    function extractYouTubeId(url) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    // Function to update the YouTube iframe with the new video ID
    function updateYouTubePlayer(videoId) {
        if (videoId) {
            document.getElementById('player').src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&showinfo=0&modestbranding=1`;
        }
    }

    // Event listener for play/pause toggle
    document.getElementById('play-btn').addEventListener('click', function() {
        let img = document.getElementById('play-icon');
        img.src = img.src.includes('play.fill.png') ? '../img/pause.fill.png' : '../img/play.fill.png';
    });

    // Event listener to check the user's answer when pressing Enter
    document.getElementById('user-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const userInput = event.target.value.trim();
            const currentTrack = trackName.trim();

            // Remove previous error message if it exists
            const existingErrorBox = document.querySelector('.error-box');
        

            // Compare user input with the actual track name
            if (userInput.toLowerCase() !== currentTrack.toLowerCase()) {
                const errorBox = document.createElement('div');
                errorBox.classList.add('error-box');
                errorBox.textContent = userInput;
                document.querySelector('.error-container').appendChild(errorBox);

                // Reveal next track element when the user fails
                revealNextTrackElement();
            } else {
                alert("Correct!");
            }

            // Clear input field
            event.target.value = "";
        }
    });

    // Call updateTrackInfo() on page load to ensure initial values are stored
    updateTrackInfo(trackArtist, releaseDate, trackImage, trackName, urlYouTube);
});