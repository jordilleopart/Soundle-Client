const challenges = [
    { name: "Game 1", username: "user1" },
    { name: "Game 2", username: "user2" },
    { name: "Game 3", username: "user3" },
    { name: "Game 4", username: "user4" },
    { name: "Game 5", username: "user1" }
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

loadChallenges();

document.getElementById('sortOrderButton').addEventListener('click', function() {
    const currentOrder = this.textContent; // Get the current button text (Ascending or Descending)
    
    if (currentOrder === 'Ascending') {
        this.textContent = 'Descending'; // Change the button text
        this.classList.add('descending'); // Add the red color for descending
    } else {
        this.textContent = 'Ascending'; // Change the button text
        this.classList.remove('descending'); // Remove the red color for ascending
    }

    // Add the sorting order logic to apply the sorting when the "Apply" button is clicked
    document.getElementById('sortApplyButton').addEventListener('click', function() {
        const sortByValue = document.getElementById('sortBy').value;
        const order = document.getElementById('sortOrderButton').textContent.toLowerCase(); // 'ascending' or 'descending'
        
        // Apply sorting logic based on the selected "Sort By" and the order (ascending or descending)
        console.log(`Sort by: ${sortByValue}, Order: ${order}`);
        // You can implement the sorting logic here based on your data and order
    });
});
