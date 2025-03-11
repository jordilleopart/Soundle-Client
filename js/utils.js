const config = {
    address: "http://localhost:3000",
    websocketBaseAddress: "ws://localhost:3000/game"
}

class Message {
    constructor(type, subtype, author, content) {
        this.type = type;
        this.subtype = subtype;
        this.author = author;
        this.content = content;
    }

    // Class method to instantiate message from either JSON object or JSON string
    static fromJson(input) {
        if (typeof input === "string") {
            input = JSON.parse(input); // Parse JSON string into an object
        }
    
        return new Message(input.type, input.subtype, input.author, input.content);
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
        this.master = null;
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
                case "system":
                    break;
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
            this.updateUsersInLobby();
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

            console.log(users);

            // Loop through the users and add them to the list
            users.forEach((user, index) => {
                const userDiv = document.createElement('div');
                userDiv.classList.add('user');  // Add a general 'user' class for styling

                // Set the first user as the master and add a crown for them
                if (index === 0) {
                    this.master = user.user_name;  // Set the master as the first user

                    console.log(this.master);

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
            if (this.master === localStorage.getItem('username')) this.startButton.classList.remove('hidden');
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

    // Reset the chat (clear history, disconnect WebSocket)
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