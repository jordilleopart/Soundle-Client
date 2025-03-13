const config = {
    address: "http://localhost:3000",
    websocketBaseAddress: "ws://localhost:3000/game",
}

class Message {
    constructor(type, subtype, author, content, trackInfo = null) {
        this.type = type;
        this.subtype = subtype;
        this.author = author;
        this.content = content;
        this.trackInfo = trackInfo;  // New field to hold track info (optional)
    }

    // Class method to instantiate message from either JSON object or JSON string
    static fromJson(input) {
        if (typeof input === "string") {
            input = JSON.parse(input); // Parse JSON string into an object
        }
    
        // Check for track info in the incoming message, and add it to the message object if available
        const trackInfo = input.trackInfo || null;
        return new Message(input.type, input.subtype, input.author, input.content, trackInfo);
    }
}

class WebSocketManager {
    constructor() {
        if (WebSocketManager.instance) {
            return WebSocketManager.instance;  // Singleton pattern
        }
        this.socket = null;
        this.messageListener = null;  // The listener for incoming messages
        WebSocketManager.instance = this;
    }

    // Initialize WebSocket to a lobbyId
    connect(lobbyId) {
        const token = localStorage.getItem('jwtToken');
        this.socket = new WebSocket(`${config.websocketBaseAddress}/${lobbyId}?token=${token}`);

        this.socket.onopen = () => {
            console.log(`Established WebSocket connection to lobby ${lobbyId}`);
        };

        this.socket.onclose = () => {
            console.log('Server closed connection');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // When a message is received, invoke the registered message listener (Chat)
        this.socket.onmessage = (event) => {
            if (this.messageListener) {
                this.messageListener(event.data);  // Pass the message data to the listener
            }
        };
    }

    // Send a message to the server through the WebSocket
    sendMessage(message) {
        if (this.socket) {
            this.socket.send(message);
        } else {
            console.log('WebSocket is not connected');
        }
    }

    // Set the message listener (Chat will be the only listener)
    setMessageListener(listener) {
        this.messageListener = listener;
    }

    // Disconnect WebSocket connection
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

class Chat {
    constructor() {
        if (Chat.instance) {
            return Chat.instance;  // Singleton pattern
        }

        this.websocketManager = new WebSocketManager();  // WebSocketManager is now part of Chat
        this.lobby = null;
        this.history = [];
        this.chatMessagesDiv = null;  // Cached reference to the chat container
        this.userListDiv = null;  // Cached reference to the user list container
        this.startButton = null;
        this.maxPlayers = null;  // Initialize maxPlayers to null
        this.currentUsers = null; // Initialize currentUsers to null
        Chat.instance = this;
    }

    // Connect to a new lobby
    connectToLobby(lobbyId) {
        // Reset the chat if we are switching lobbies
        this.reset();
        this.lobby = lobbyId;
        this.websocketManager.connect(lobbyId);
        this.websocketManager.setMessageListener(this.handleMessage.bind(this));
        console.log(`Connected to lobby: ${lobbyId}`);
        
        // Cache the references to the #chat-messages and #user-list elements when connecting to a lobby
        this.cacheDivElements();
    }

    // Cache the reference to the first elements with class 'chat-messages' and 'user-list'
    cacheDivElements() {
        this.chatMessagesDiv = document.querySelector('.chat-messages');  // Get the first matching element for chat
        this.userListDiv = document.querySelector('.user-list');  // Get the first matching element for user list
        this.startButton = document.querySelector('.start-button');
    }

    // Method to set maxPlayers and currentUsers
    setLobbyData(maxPlayers, currentUsers) {
        this.maxPlayers = maxPlayers;
        this.currentUsers = currentUsers;

        // Now you can update the user count in the UI
        if (this.userListDiv) {
            document.getElementById('users-count').textContent = `${this.currentUsers}/${this.maxPlayers}`;
        }
    }

    // Handle incoming WebSocket messages
    handleMessage(messageData) {
        const message = Message.fromJson(messageData);
        this.history.push(message);  // Store message in history
        console.log("New message received:", message);

        if (this.chatMessagesDiv) {
            // Handle incoming messages depending on the type
            switch (message.type) {
                case "chat":
                    if (message.author === localStorage.getItem('username')) this.addMessageToChat(message, 'sent');
                    else if (message.author) this.addMessageToChat(message, 'received');
                    else {
                        this.addMessageToChat(message, message.subtype);
                    }
                    break;
                case "start":
                    // Redirect to game
                    window.location.href = `game.html?gameId=${this.lobby}&round=1`;
                    break;
                case "track":
                    const trackInfo = message.trackInfo;
                    console.log(trackInfo)
                    game.updateTrackInfo(trackInfo.track_artist, trackInfo.track_release_date, trackInfo.track_cover_url, trackInfo.track_name, trackInfo.track_audio_path);
                default:
                    break;
            }
        }
    }

    addMessageToChat(messageElement, messageClass) {
        // Create a new message element
        const newMessage = document.createElement('div');
        
        // Add the provided class (e.g., 'sent', 'received', or 'system')
        newMessage.classList.add('message', messageClass);

        if (messageClass !== 'system') {
            const authorElement = document.createElement('div');
            authorElement.classList.add('message-author');
            authorElement.textContent = messageElement.author; // Set the author's name
            newMessage.appendChild(authorElement); // Add the author to the message
        } else {
            setTimeout(() => {
                this.updateUsersInLobby();
            }, 500);
        }
        
        // Add the message content (the actual text)
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.textContent = messageElement.content; // Set the message content
        newMessage.appendChild(contentElement); // Add the content to the message
        
        // Add the new message to the chat container
        this.chatMessagesDiv.appendChild(newMessage);
        
        // Scroll to the bottom of the chat (optional)
        this.chatMessagesDiv.scrollTop = this.chatMessagesDiv.scrollHeight;
    }

    // Update the user list in the lobby
    updateUsersInLobby() {
        if (!this.userListDiv) return; // If userListDiv is not cached, exit early

        // Get the JWT token from local storage
        const token = localStorage.getItem('jwtToken');

        // Fetch the list of users in the lobby
        fetch(`${config.address}/game/users?gameId=${this.lobby}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            const users = data.users;

            if (!users || users.length === 0) {
                this.userListDiv.innerHTML = '';  // Clear user list
                return;
            }

            // Clear the existing list
            this.userListDiv.innerHTML = '';

            // Loop through the users and add them to the list
            users.forEach((user, index) => {
                const userDiv = document.createElement('div');
                userDiv.classList.add('user');  // Add a general 'user' class for styling

                // Set the first user as the master and add a crown for them
                if (index === 0) {
                    localStorage.setItem('master', user.user_name);  // Set the master as the first user

                    const crownDiv = document.createElement('div');
                    crownDiv.classList.add('user-crown');
                    const crownImage = document.createElement('img');
                    crownImage.src = '../img/crown.png'; // Placeholder path for the crown
                    crownImage.alt = 'Master';
                    crownDiv.appendChild(crownImage);
                    userDiv.appendChild(crownDiv);  // Append crown above the user icon
                }

                // Create the user icon element
                const userIconDiv = document.createElement('div');
                userIconDiv.classList.add('user-icon');
                const userIcon = document.createElement('img');
                userIcon.src = '../img/person.crop.circle.fill-grey.png';
                userIcon.alt = user.user_name;
                userIconDiv.appendChild(userIcon);

                // Create the username element
                const usernameDiv = document.createElement('div');
                usernameDiv.classList.add('username');
                usernameDiv.textContent = user.user_name;

                // Set a background color for the current logged-in user
                if (user.user_name === localStorage.getItem('username')) {
                    userDiv.style.backgroundColor = '#d3f4ff'; // Highlight the current user
                }

                // Append icon and username to the user div
                userDiv.appendChild(userIconDiv);
                userDiv.appendChild(usernameDiv);

                // Append the user div to the user list
                this.userListDiv.appendChild(userDiv);
            });

            // Update start button
            if (localStorage.getItem('master') === localStorage.getItem('username')) this.startButton.classList.remove('hidden');
            else this.startButton.classList.add('hidden');

            // Update user count
            this.currentUsers = users.length;
            document.getElementById('users-count').textContent = `${this.currentUsers}/${this.maxPlayers}`;
        })
        .catch(error => {
            console.error('Error fetching users:', error);
        });
    }

    // Send a message through the WebSocketManager
    sendMessage(message) {
        this.websocketManager.sendMessage(message);
    }

    reset() {
        this.lobby = null;
        this.history = [];
        this.websocketManager.disconnect();
        console.log("Chat has been reset.");
    }

    // Singleton getter
    static getInstance() {
        if (!Chat.instance) {
            Chat.instance = new Chat();
        }
        return Chat.instance;
    }
}

// initialize the Chat instance
const chat = Chat.getInstance();

class Game {
    constructor() {
        this.trackArtist = "";
        this.trackName = "";
        this.trackImage = "";
        this.releaseDate = "";
        this.audioDuration = 30;
        this.startTime = 50;
        this.currentStep = 0;
        this.guessesLeft = 4;
        this.canBePlayed = false;
    }

    // Initialize the game with track information and initial setup
    updateTrackInfo(artist, releaseDate, coverUrl, name, trackAudioBase64) {
        // DOM Element References
        this.elements = [
            document.getElementById('track-year'),
            document.getElementById('track-image'),
            document.getElementById('track-artist')
        ];

        this.attemptBoxes = document.querySelectorAll('.attempt-box');


        this.updateUserStatus();

        this.trackArtist = artist;
        this.trackName = name;
        this.trackImage = coverUrl;
        this.releaseDate = releaseDate;
        this.updateTrackUI();
        this.updateAudioPlayer(trackAudioBase64);
    }

    // Update Track information on the UI
    updateTrackUI() {
        document.getElementById('track-artist').textContent = `Artist: ${this.trackArtist}`;
        document.getElementById('track-year').textContent = `Release date: ${new Date(this.releaseDate).toLocaleDateString('en-GB')}`;
        document.getElementById('track-image').src = this.trackImage;
    }

    // Update Audio Player UI
    updateAudioPlayer(trackAudioBase64) {
        const audioPlayerElem = document.getElementById('audio-player');
        audioPlayerElem.src = `data:audio/mp3;base64,${trackAudioBase64}`;
        audioPlayerElem.load();
        audioPlayerElem.oncanplaythrough = () => {
            this.canBePlayed = true;
        }
    }

    updateUserStatus() {
        this.currentStep = 0;
        this.guessesLeft = 4;
        this.resetUserAttempts();

        this.elements.forEach(element => element.classList.add('hidden'));
        this.attemptBoxes.forEach(box => box.style.backgroundColor = '');
    }

    // Reveal next track element (hint)
    revealNextTrackElement() {
        if (this.currentStep < this.elements.length) {
            this.elements[this.currentStep].classList.remove('hidden');
            this.currentStep++;
        } else {
            this.currentStep++;
        }
    }

    // Handle user input (check if correct or incorrect)
    checkUserInput(userInput) {
        const currentTrack = this.trackName.trim();
        const username = localStorage.getItem('username');

        if (userInput === "") userInput = "Skipped";

        if (userInput.toLowerCase() !== currentTrack.toLowerCase()) {
            this.attemptBoxes[this.currentStep].style.backgroundColor = 'red';
            this.updateUserAttempts(username, 'miss', this.currentStep);
            this.revealNextTrackElement();
            chat.sendMessage(JSON.stringify({ type: "chat", subtype: "incorrect", content: `${username} missed attempt #${this.currentStep}.` }));
        } else {
            this.updateUserPoints(username, 100);
            this.updateUserAttempts(username, 'guessed', this.currentStep);
            this.attemptBoxes[this.currentStep].style.backgroundColor = '#4CAF50';
            this.guessesLeft = 0;
            chat.sendMessage(JSON.stringify({ type: "chat", subtype: "correct", content: `${username} guessed the track in attempt #${this.currentStep+1}.` }));
        }
    }

    // Update User Points
    updateUserPoints(username, pointsToAdd) {
        const userRows = document.querySelectorAll('.user-row');
        userRows.forEach(row => {
            const usernameElem = row.querySelector('.username');
            if (usernameElem && usernameElem.textContent === username) {
                const pointsElem = row.querySelector('.points');
                if (pointsElem) {
                    const currentPoints = parseInt(pointsElem.textContent, 10);
                    const newPoints = currentPoints + pointsToAdd;
                    pointsElem.textContent = newPoints;
                }
            }
        });
    }

    // Update User Attempts (whether correct or incorrect)
    updateUserAttempts(username, state, currentInput) {
        const userRows = document.querySelectorAll('.user-row');
        userRows.forEach(row => {
            const usernameElem = row.querySelector('.username');
            if (usernameElem && usernameElem.textContent.trim() === username) {
                const attemptBoxes = row.querySelectorAll('.attempts .attempt-box');
                attemptBoxes.forEach((box, index) => {
                    if (index < currentInput) {
                        box.classList.add('attempt-box-incorrect');
                    } else if (index === currentInput) {
                        box.classList.add(state === 'guessed' ? 'attempt-box-correct' : 'attempt-box-incorrect');
                    }
                });
            }
        });
    }

    // Show Users with Leaderboard
    showUsersWithLeaderboard(users) {
        const leaderboardList = document.querySelector('.leaderboard-list');
        leaderboardList.innerHTML = '';

        users.forEach(user => {
            const userRow = this.createUserRow(user);
            leaderboardList.appendChild(userRow);
        });
    }

    // Create user row for leaderboard
    createUserRow(user) {
        const userRow = document.createElement('div');
        userRow.classList.add('user-row');

        const profilePic = document.createElement('img');
        profilePic.src = "../img/person.crop.circle.fill-grey.png";
        profilePic.alt = user.username;
        profilePic.classList.add('profile-pic');

        const userDetails = document.createElement('div');
        userDetails.classList.add('user-details');

        const userInfo = document.createElement('div');
        userInfo.classList.add('user-info');

        const usernameElem = document.createElement('p');
        usernameElem.classList.add('username');
        usernameElem.textContent = user.username;

        const pointsElem = document.createElement('p');
        pointsElem.classList.add('points');
        pointsElem.textContent = user.points;

        userInfo.appendChild(usernameElem);
        userInfo.appendChild(pointsElem);

        const attemptsElem = document.createElement('div');
        attemptsElem.classList.add('attempts-leaderboard');

        for (let i = 0; i < user.attempts; i++) {
            const attemptBox = document.createElement('div');
            attemptBox.classList.add('attempt-box');
            attemptsElem.appendChild(attemptBox);
        }

        userDetails.appendChild(userInfo);
        userDetails.appendChild(attemptsElem);

        userRow.appendChild(profilePic);
        userRow.appendChild(userDetails);

        return userRow;
    }

    // Reset User Attempts
    resetUserAttempts() {
        const userRows = document.querySelectorAll('.user-row');
        userRows.forEach(row => {
            const attemptBoxes = row.querySelectorAll('.attempt-box');
            attemptBoxes.forEach(box => {
                box.classList.remove('attempt-box-correct', 'attempt-box-incorrect');
            });
        });
    }

    // Handle Audio Play/Pause
    togglePlayPause = () => {
        const playButtonIcon = document.getElementById('play-icon');
        const audioPlayer = document.getElementById('audio-player');
        if (audioPlayer.paused && this.canBePlayed) {
            audioPlayer.currentTime = this.startTime;
            audioPlayer.play();
            playButtonIcon.src = '../img/pause.fill.png';
            this.updateProgress();
            setTimeout(() => {
                audioPlayer.pause();
                playButtonIcon.src = '../img/play.fill.png';
                audioPlayer.currentTime = this.startTime;
            }, this.audioDuration * 1000);
            this.canBePlayed = false;
        } else {
            audioPlayer.pause();
            playButtonIcon.src = '../img/play.fill.png';
            audioPlayer.currentTime = this.startTime;
        }
    }

    // Update Progress Bar
    updateProgress() {
        const audioPlayer = document.getElementById('audio-player');
        const progressSlider = document.getElementById('audio-progress');
        if (audioPlayer && !audioPlayer.paused) {
            progressSlider.value = (audioPlayer.currentTime - this.startTime) / this.audioDuration * 100;
            requestAnimationFrame(this.updateProgress.bind(this));
        }
    }
}

// Game Initialization
const game = new Game();