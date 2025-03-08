

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

function showUsersFinalLeaderboard(users) {
    const leaderboardContainer = document.querySelector('.leaderboard-list');
    leaderboardContainer.innerHTML = ''; // Limpiar leaderboard

    // Crear el podio
    const podium = document.createElement('div');
    podium.classList.add('podium');

    const positions = [
        { place: '1st', className: 'first-place' },
        { place: '2nd', className: 'second-place' },
        { place: '3rd', className: 'third-place' }
    ];

    positions.forEach((pos, index) => {
        if (users[index]) {
            const podiumSpot = document.createElement('div');
            podiumSpot.classList.add('podium-spot', pos.className);

            const profilePic = document.createElement('img');
            profilePic.src = "../img/person.crop.circle.fill-grey.png";
            profilePic.alt = users[index].username;
            profilePic.classList.add('profile-pic');

            const placeElem = document.createElement('p');
            placeElem.classList.add('place');
            placeElem.textContent = pos.place;

            const usernameElem = document.createElement('p');
            usernameElem.classList.add('username');
            usernameElem.textContent = users[index].username;

            const pointsElem = document.createElement('p');
            pointsElem.classList.add('points');
            pointsElem.textContent = users[index].points;

            podiumSpot.appendChild(placeElem);
            podiumSpot.appendChild(profilePic);
            podiumSpot.appendChild(usernameElem);
            podiumSpot.appendChild(pointsElem);
            podium.appendChild(podiumSpot);
        }
    });

    leaderboardContainer.appendChild(podium);

    // Contenedor para los usuarios del 4° al 12° lugar
    const usersContainer = document.createElement('div');
    usersContainer.classList.add('users-container');

    const columnLeft = document.createElement('div');
    columnLeft.classList.add('column-left');

    const columnRight = document.createElement('div');
    columnRight.classList.add('column-right');

    // Distribuir usuarios alternadamente entre izquierda y derecha
    users.slice(3, 12).forEach((user, index) => {
        const position = index + 4; // Ajustar el número de posición
        const userRow = createUserRow(user, position);

        if (index % 2 === 0) {
            columnLeft.appendChild(userRow);  // Posiciones pares van a la izquierda
        } else {
            columnRight.appendChild(userRow); // Posiciones impares van a la derecha
        }
    });

    usersContainer.appendChild(columnLeft);
    usersContainer.appendChild(columnRight);
    leaderboardContainer.appendChild(usersContainer);
}

// Función auxiliar para crear una fila de usuario
function createUserRow(user, position) {
    const userRow = document.createElement('div');
    userRow.classList.add('user-row');

    const positionElem = document.createElement('p');
    positionElem.classList.add('position');
    positionElem.textContent = `${position}th`;

    const profilePic = document.createElement('img');
    profilePic.src = "../img/person.crop.circle.fill-grey.png";
    profilePic.alt = user.username;
    profilePic.classList.add('profile-pic');

    const usernameElem = document.createElement('p');
    usernameElem.classList.add('username');
    usernameElem.textContent = user.username;

    const pointsElem = document.createElement('p');
    pointsElem.classList.add('points');
    pointsElem.textContent = user.points;

    userRow.appendChild(positionElem);
    userRow.appendChild(profilePic);
    userRow.appendChild(usernameElem);
    userRow.appendChild(pointsElem);

    return userRow;
}

document.addEventListener('DOMContentLoaded', () => {
    const users = [
        { username: 'Username1', points: 13, attempts: { correct: 2, incorrect: 2 } },
        { username: 'Username2', points: 20, attempts: { correct: 1, incorrect: 3 } },
        { username: 'Username3', points: 24, attempts: { correct: 3, incorrect: 1 } },
        { username: 'Username4', points: 80, attempts: { correct: 0, incorrect: 4 } },
        { username: 'Username5', points: 45, attempts: { correct: 4, incorrect: 0 } },
        { username: 'Username11', points: 20, attempts: { correct: 1, incorrect: 3 } },
        { username: 'Username12', points: 24, attempts: { correct: 3, incorrect: 1 } },
        { username: 'Username13', points: 13, attempts: { correct: 2, incorrect: 2 } },
        

        
    ];

    users.sort((a, b) => b.points - a.points);

    showUsersFinalLeaderboard(users);
});