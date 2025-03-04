
// CHECK FIRST IF USER IS LOGGEDDD


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
    list.innerHTML = "";

    results.forEach(challenge => {
        const challengeDiv = document.createElement("div");
        challengeDiv.classList.add("challenge");

        const gameDetails = document.createElement("span");
        gameDetails.classList.add("game-details");

        const gameId = document.createElement("span");
        gameId.textContent = `${challenge.game_id}`;
        gameId.classList.add("game-id");  // Added class for styling
        gameDetails.appendChild(gameId);

        const gameCreator = document.createElement("strong");
        gameCreator.textContent = ` by ${challenge.user_name}`;
        gameDetails.appendChild(gameCreator);

        // Create and display the creation time (hh:mm:ss format)
        const creationTime = document.createElement("span");
        creationTime.classList.add("creation-time");
        const creationDate = new Date(challenge.creation_date);
        const hours = creationDate.getHours().toString().padStart(2, '0');
        const minutes = creationDate.getMinutes().toString().padStart(2, '0');
        const seconds = creationDate.getSeconds().toString().padStart(2, '0');
        creationTime.textContent = `Created at: ${hours}:${minutes}:${seconds}`;
        gameDetails.appendChild(creationTime);

        challengeDiv.appendChild(gameDetails);

        const gameStats = document.createElement("span");
        gameStats.classList.add("game-stats");

        const players = document.createElement("span");
        players.textContent = `${challenge.num_players}/${challenge.max_players} players`;
        gameStats.appendChild(players);

        const rounds = document.createElement("span");
        rounds.textContent = `Rounds: ${challenge.rounds}`;
        gameStats.appendChild(rounds);

        const playlist = document.createElement("span");
        playlist.textContent = `Playlist: ${challenge.playlist}`;
        gameStats.appendChild(playlist);

        challengeDiv.appendChild(gameStats);

        // Show game type (Public or Private)
        const gameType = document.createElement("span");
        gameType.textContent = challenge.game_type === 'private' ? "Private" : "Public";
        gameType.classList.add(challenge.game_type === 'private' ? 'private' : 'public');
        challengeDiv.appendChild(gameType);

        const buttonDiv = document.createElement("div");
        buttonDiv.classList.add("button");

        // Create a button instead of a link for the lobby
        const button = document.createElement("button");
        button.textContent = "Enter Lobby";
        button.classList.add("enter-lobby-button");

        // Handle click event for private games
        if (challenge.game_type === 'private') {
            button.classList.add('private-button');
            button.addEventListener('click', (event) => {
                event.preventDefault();
                showGameCodePopup(challenge.game_id);  // Show the game code popup for private games
            });
        } else {
            button.addEventListener('click', () => {
                window.location.href = `lobby.html?game_id=${challenge.game_id}`;  // Redirect to the lobby for public games
            });
        }

        buttonDiv.appendChild(button);
        challengeDiv.appendChild(buttonDiv);

        list.appendChild(challengeDiv);
    });
};

function showGameCodePopup(gameId) {
    const popup = document.createElement("div");
    popup.classList.add("game-code-popup");

    // Popup content
    popup.innerHTML = `
        <div class="popup-content">
            <h2>Introduce game code</h2>
            <input type="text" id="gameCode" placeholder="Enter game code" />
            <p class="error-message"></p> <!-- Initially empty error message -->
            <button id="submitGameCode">Submit</button>
            <button id="closePopup">X</button>
        </div>
    `;

    document.body.appendChild(popup);

    // Close popup handler
    document.getElementById("closePopup").addEventListener("click", function() {
        document.body.removeChild(popup);
    });

    // Submit code handler
    document.getElementById("submitGameCode").addEventListener("click", function() {
        const code = document.getElementById("gameCode");
        const errorMessage = document.querySelector(".error-message"); // Get the error message element
        
        if (code.value) {
            code.classList.remove('input-error');
            errorMessage.style.display = 'none'; // Hide the error message if code is provided

            // Get the JWT token from local storage
            const token = localStorage.getItem('jwtToken');

            
            fetch(`${config.address}/game/join/${gameId}?code=${code.value}`, {
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
                    // 403 forbidden (wrong password) or 404 not found (game does not exist anymore)
                    case 403:
                    case 422:
                        response.json().then(data => {
                            code.classList.add('input-error');
                            errorMessage.textContent = data.message; // Update the error message text
                            errorMessage.style.display = 'block'; // Show the error message
                        });
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


        } else {
            code.classList.add('input-error');
            errorMessage.textContent = 'Please, provide a code.'; // Update the error message text
            errorMessage.style.display = 'block'; // Show the error message
        }
    });
}

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
        updatePaginationResults(data.pagination);
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

function updatePaginationResults(pagination) {
    // update page X of X
    document.getElementById("currentPage").innerText = `Page ${pagination.pageNumber} of ${pagination.totalPages}`;
    // update showing x-x of x results
    const firstResultNum = pagination.pageSize * (pagination.pageNumber-1) + 1;
    const lastResultNum = firstResultNum + pagination.pageSize;
    document.getElementById("rangeDisplay").innerText = `Showing ${firstResultNum}-${lastResultNum} of ${pagination.totalCount} results`
}

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
