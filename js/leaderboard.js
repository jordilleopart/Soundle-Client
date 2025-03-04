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

document.addEventListener('DOMContentLoaded', () => {
    const users = [
        { username: 'Username1', points: 100, attempts: { correct: 2, incorrect: 2 } },
        { username: 'Username2', points: 80, attempts: { correct: 1, incorrect: 3 } },
        { username: 'Username3', points: 100, attempts: { correct: 3, incorrect: 1 } },
        { username: 'Username4', points: 80, attempts: { correct: 0, incorrect: 4 } },
        { username: 'Username5', points: 100, attempts: { correct: 4, incorrect: 0 } },
        { username: 'Username6', points: 80, attempts: { correct: 2, incorrect: 2 } },
    ];
    showUsersWithLeaderboard(users);

    // Update attempts for a specific user
    updateAttempts('Username1', { correct: 3, incorrect: 1 });
});