const numParticipants = document.getElementById('num-participants');
const numParticipantsValue = document.getElementById('num-participants-value');
const publicBtn = document.getElementById('public-btn');
const privateBtn = document.getElementById('private-btn');
const numRounds = document.getElementById('num-rounds'); // Get the rounds input field

var game_type = 'public';

numParticipants.addEventListener('input', () => {
    numParticipantsValue.textContent = numParticipants.value;
});

publicBtn.addEventListener('click', () => {
    publicBtn.classList.add('active');
    privateBtn.classList.remove('active');
    game_type = 'public';
});

privateBtn.addEventListener('click', () => {
    privateBtn.classList.add('active');
    publicBtn.classList.remove('active');
    game_type = 'private';
});

// Trigger submit action for next step
const createForm = document.getElementById("create-form");
createForm.addEventListener('submit', (event) => {
    // prevent page from refreshing
    event.preventDefault();

    // Move to playlist selection with additional rounds parameter
    window.location.href = `pick-playlist.html?participants=${numParticipants.value}&type=${game_type}&rounds=${numRounds.value}`;
});
