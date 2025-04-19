// Function to get all URL parameters as an object
function getUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    for (const [key, value] of params) {
        result[key] = value;
    }
    
    return result;
}

const playlists = document.querySelectorAll('.playlist, .other-playlist');
console.log(playlists); // Show all playlists in the console

// Add a click event listener to each link
playlists.forEach(playlist => {
    playlist.addEventListener('click', function(event) {
        // Prevent the default link behavior (navigating to the href)
        event.preventDefault();

        // Retrieve the text content of the link (anchor tag)
        const playlistItem = document.querySelector('.playlist-item');
        const playlistText = playlistItem.textContent.trim();
        //const playlistText = "looby.html"; // Default value change later

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


// Function to create playlist buttons dynamically
function createPlaylistItem(playlistNames, playlistCreators, playlistGridId) {
    // Obtener el contenedor por su ID
    const playlistGridElement = document.getElementById(playlistGridId);
    const playlistType = playlistGridId === 'my-playlists-grid' ? 'playlist' : 'other-playlist';

    // Verificar si el contenedor existe
    if (!playlistGridElement) {
        console.error(`Element with ID "${playlistGridId}" not found.`);
        return;
    }

    // Iterar sobre los nombres de las playlists
    playlistNames.forEach(name => {
        // Crear el contenedor principal para la playlist
        const playlistItem = document.createElement('div');
        playlistItem.classList.add('playlist-item');

        // Crear el enlace de la playlist
        const playlistLink = document.createElement('a');
        playlistLink.classList.add(`${playlistType}`);
        playlistLink.href = "lobby.html";

        // Crear la imagen de la playlist
        const playlistCover = document.createElement('img');
        playlistCover.src = "../img/music.note.list.png";
        playlistCover.alt = `${name} cover`;
        playlistCover.classList.add('playlist-cover');

        // Crear el nombre de la playlist
        const playlistInfo = document.createElement('div');
        playlistInfo.classList.add('playlist-info');

        const playlistName = document.createElement('p');

        playlistName.textContent = name;
        playlistName.classList.add('playlist-name');
        playlistInfo.appendChild(playlistName);

        const playlistCreator = document.createElement('p');
        playlistCreator.textContent = `${playlistCreators}`; // not working right now
        
        
        playlistCreator.classList.add('playlist-creator');
        
        playlistInfo.appendChild(playlistCreator);

        // Construir la estructura
        playlistLink.appendChild(playlistCover);
        playlistItem.appendChild(playlistLink);
        playlistItem.appendChild(playlistInfo);

        // Añadir el elemento al contenedor principal
        playlistGridElement.appendChild(playlistItem);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    createPlaylistItem(['Music that my innie would listent to if he worked in a 80s company', 'My Playlist 2', 'My Playlist 3', 'My Playlist 4', 'My Playlist 5'], 'jordilleopart','my-playlists-grid');
    createPlaylistItem(['Not My Playlist 1', 'Not My Playlist 2', 'Not My Playlist 3', 'Not My Playlist 4', 'Not My Playlist 5', 'Not My Playlist 6', 'Not My Playlist 7', 'Not My Playlist 8', 'Not My Playlist 9'] , 'not jordilleopart','popular-playlists');
    createPlaylistItem(['Not My Playlist 1', 'Not My Playlist 2', 'Not My Playlist 3'], 'not jordilleopart', 'recent-playlists');
});