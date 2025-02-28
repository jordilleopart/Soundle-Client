const numParticipants = document.getElementById('num-participants');
const numParticipantsValue = document.getElementById('num-participants-value');
const publicBtn = document.getElementById('public-btn');
const privateBtn = document.getElementById('private-btn');

numParticipants.addEventListener('input', () => {
    numParticipantsValue.textContent = numParticipants.value;
});

publicBtn.addEventListener('click', () => {
    publicBtn.classList.add('active');
    privateBtn.classList.remove('active');
});

privateBtn.addEventListener('click', () => {
    privateBtn.classList.add('active');
    publicBtn.classList.remove('active');
});