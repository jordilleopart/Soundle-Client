var ordering = "Ascending";
const sortColumn = document.getElementById('sortBy');
const filterColumn = document.getElementById('filterBy');
const searchInput = document.getElementById('search');
const list = document.getElementById("challengeList");


// Used to map frontend values to backend SQL table definitions
const mapping = {
    "Ascending": "ASC",
    "Descending": "DESC"
};

function resetFilterValues() {
    filterColumn.value = ''; // Reset the value of the 'filterBy' element
    searchInput.value = '';  // Reset the value of the 'search' input
}

function resetSortValues() {
    sortColumn.value = '';   // Reset the value of the 'sortBy' element
    ordering = "Descending";
    toggleSortOrder(document.getElementById('sortOrderButton'));
}

function checkColumnSelected(element) {
    if (element.value !== "") return true;
    else return false;
};

// Function to handle the sort order toggle
function toggleSortOrder(button) {
    // Toggle the ordering between 'Ascending' and 'Descending'
    ordering = (ordering === "Ascending") ? "Descending" : "Ascending";
    
    // Update button text and styles based on the new ordering value
    button.textContent = ordering; // Directly set the new ordering value (which is already capitalized)
    button.classList.toggle('descending', ordering === 'Descending'); // Add or remove 'descending' class
}

// Function to display challenges on the page
function showChallenges(results) {
    // Clear the current list of challenges
    list.innerHTML = "";

    // Iterate through the results (which should always be 5 elements)
    results.forEach(challenge => {
        // Create the outer div for the challenge
        const challengeDiv = document.createElement("div");
        challengeDiv.classList.add("challenge");

        // Create a span to hold the game id and game creator
        const gameDetails = document.createElement("span");
        gameDetails.classList.add("game-details");

        // Create and append game id (no bold, no "Game ID:" text)
        const gameId = document.createElement("span");
        gameId.textContent = `${challenge.game_id}`;
        gameDetails.appendChild(gameId);

        // Create and append game creator (in bold)
        const gameCreator = document.createElement("strong");
        gameCreator.textContent = ` by ${challenge.game_creator}`;
        gameDetails.appendChild(gameCreator);

        challengeDiv.appendChild(gameDetails);

        // Create another span for displaying players, rounds, and playlist
        const gameStats = document.createElement("span");
        gameStats.classList.add("game-stats");

        // Create and append players in the format numPlayers/maxPlayers
        const players = document.createElement("span");
        players.textContent = `${challenge.num_players}/${challenge.max_players} players`;
        gameStats.appendChild(players);

        // Create and append rounds
        const rounds = document.createElement("span");
        rounds.textContent = `Rounds: ${challenge.rounds}`;
        gameStats.appendChild(rounds);

        // Create and append playlist
        const playlist = document.createElement("span");
        playlist.textContent = `Playlist: ${challenge.playlist}`;
        gameStats.appendChild(playlist);

        challengeDiv.appendChild(gameStats);

        // Create the button to enter the lobby
        const buttonDiv = document.createElement("div");
        buttonDiv.classList.add("button");

        const button = document.createElement("a");
        button.href = `lobby.html?game_id=${challenge.game_id}`; // Pass the game id in the URL
        button.textContent = "Enter Lobby";
        buttonDiv.appendChild(button);

        challengeDiv.appendChild(buttonDiv);

        // Append the entire challenge div to the list
        list.appendChild(challengeDiv);
    });
};

// Function to display a "No Results" message
function showNoResults() {
    // Clear the current list of challenges
    list.innerHTML = "";

    // Create a new div to show no results message
    const noResultsDiv = document.createElement("div");
    noResultsDiv.classList.add("no-results");

    // Add message content
    noResultsDiv.innerHTML = `
        <span>No challenges found.</span>
    `;

    // Append the "No Results" message to the list
    list.appendChild(noResultsDiv);
}

async function fetchAvailableChallenges(path) {

    // Get the JWT token from local storage
    const token = localStorage.getItem('jwtToken');

    // Ask backend for games, with correct route/mode
    return fetch(`${config.address}/game/available/${path}`, {
        method: 'GET',
		headers: {
            'Content-Type': 'application/json', // Important for JSON payload
            'Authorization': `Bearer ${token}` // Send the JWT token in the header
        }
    })
    .then(response => {
        switch (response.status) {
            case 200:
                return response.json();
            default:
                // Handle other error responses (e.g., 400, 500, etc.)
                response.json().then(data => {
                    sessionStorage.setItem('httpStatus', response.status);
                    sessionStorage.setItem('customMessage', data.message);
                });
                // Redirect to error-template.html upon error
                window.location.href = 'error-template.html';
                break;
        }
    })
    .then(data => {
        return data.games;
    })
    .catch((error) => {
        // Handle errors parsing json
        sessionStorage.setItem('httpStatus', 500);
        sessionStorage.setItem('customMessage', "Internal Server Error");
        // Redirect to error-template.html upon error
        window.location.href = 'error-template.html';
    });

};

// Handle sort order button click
document.getElementById('sortOrderButton').addEventListener('click', function() { toggleSortOrder(this); });

// Handle sort request
document.getElementById('sortApplyButton').addEventListener('click', async function() {

    if (checkColumnSelected(sortColumn)) sortColumn.classList.remove('input-error');
    else {
        sortColumn.classList.add('input-error');
        return;
    }

    resetFilterValues();

    const path = `sort?sortBy=${sortColumn.value}&sortOrder=${mapping[ordering]}`;

    // request to backend challenges with the given sorting
    const results = await fetchAvailableChallenges(path);

    // Check if any result
    if (results.length > 0) {
        showChallenges(results);
    } else {
        // Display no results obtained
        showNoResults();
    }
});

// Handle filter request
document.getElementById('filterApplyButton').addEventListener('click', async function() {
    
    if (checkColumnSelected(filterColumn)) {
        filterColumn.classList.remove('input-error');
    } else {
        filterColumn.classList.add('input-error');
        return;
    }

    if (searchInput.value !== '') {
        searchInput.classList.remove('input-error');

        resetSortValues();

        const path = `filter?filterBy=${filterColumn.value}&filterValue=${encodeURIComponent(searchInput.value)}`;

        // request to backend challenges with the given filter
        const results = await fetchAvailableChallenges(path);

        // Check if any result
        if (results.length > 0) {
            showChallenges(results);
        } else {
            // Display no results obtained
            showNoResults();
        }

    } else {
        // Input is empty, show "error"
        searchInput.classList.add('input-error');
    }
});