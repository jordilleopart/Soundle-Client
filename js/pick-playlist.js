const challenges = [
    { name: "Game 1", username: "user1" },
    { name: "Game 2", username: "user2" },
    { name: "Game 3", username: "user3" },
    { name: "Game 4", username: "user4" },
    { name: "Game 5", username: "user1" },
    { name: "Game 6", username: "user2" },
    { name: "Game 7", username: "user3" },
    { name: "Game 8", username: "user4" }

];

function loadChallenges() {
    const list = document.getElementById("challengeList");
    list.innerHTML = "";
    challenges.forEach(challenge => {
        const div = document.createElement("div");
        div.classList.add("challenge");
        div.innerHTML = `
            <span><strong>${challenge.name}</strong> by ${challenge.username}</span>
            <div class="button">
                <a href="lobby.html">Enter Lobby</a>
            </div>
        `;
        list.appendChild(div);
    });
}

function playRandom() {
    alert("Playing a random challenge!");
}

loadChallenges();