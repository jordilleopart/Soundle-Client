const config = {
    address: "http://localhost:3000",
    websocketBaseAddress: "ws://localhost:3000/game"
}

class Message {
    constructor(type, author, content) {
        this.type = type;
        this.author = author;
        this.content = content;
    }

    // Class method to instantiate message from either JSON object or JSON string
    static fromJson(input) {
        if (typeof input === "string") {
            input = JSON.parse(input); // Parse JSON string into an object
        }
    
        return new Message(input.type, input.author, input.content);
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
            this.socket.send(JSON.stringify(message));
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

        // Only proceed if the #chat-messages div exists and is cached
        if (this.chatMessagesDiv) {
            if (message.author === localStorage.getItem('username')) {
                this.addMessageToChat(message, 'sent');
            } else if (message.author === 'system') {
                this.addMessageToChat(message, 'system');
                this.updateUsersInLobby();
            } else {
                this.addMessageToChat(message, 'received');
            }
        }
    }

    addMessageToChat(messageElement, messageClass) {
        // Create a new message element
        const newMessage = document.createElement('div');
        
        // Add the provided class (e.g., 'sent', 'received', or 'system')
        newMessage.classList.add('message', messageClass);
        
        const authorElement = document.createElement('div');
        authorElement.classList.add('message-author');

        // If the message is not from 'system', display the author's name above the content
        if (messageClass === 'sent') {
            authorElement.textContent = 'You'; // Set the author's name
        } else if (messageClass !== 'system') {
            authorElement.textContent = messageElement.author; // Set the author's name
        }

        newMessage.appendChild(authorElement); // Add the author to the message
        
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

        // Fetch the list of users in the lobby (replace URL with your actual endpoint)
        fetch(`${config.address}/game/users?gameId=${this.lobby}`, {
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
                    // Handle other error responses (e.g., 500, etc.)
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
            // Ensure the response structure has the 'users' array
            const users = data.users;

            // If there are no users or the users array is empty, clear the list and return
            if (!users || users.length === 0) {
                this.userListDiv.innerHTML = '';  // Clear the user list div
                return;
            }

            // Clear existing user elements in the list
            this.userListDiv.innerHTML = '';

            // Get the username of the current logged-in user
            const currentUsername = localStorage.getItem('username');

            // Loop through the list of users and add each one to the user list
            users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.classList.add('user');  // Add a general 'user' class for styling

                // Create the user icon element
                const userIconDiv = document.createElement('div');
                userIconDiv.classList.add('user-icon');
                const userIcon = document.createElement('img');
                userIcon.src = '../img/person.crop.circle.fill-grey.png';  // Default image
                userIcon.alt = user.user_name;  // Set the alt text to the username
                userIconDiv.appendChild(userIcon);

                // Create the username element
                const usernameDiv = document.createElement('div');
                usernameDiv.classList.add('username');
                usernameDiv.textContent = user.user_name;

                // Set a different background color for the current user
                if (user.user_name === currentUsername) {
                    userDiv.style.backgroundColor = '#d3f4ff';  // Light blue background for the current user (you can change the color)
                }

                // Append the icon and username to the user div
                userDiv.appendChild(userIconDiv);
                userDiv.appendChild(usernameDiv);

                // Append the user div to the user-list container
                this.userListDiv.appendChild(userDiv);
            });

            // Update the number of users in the room (currentUsers/maxPlayers)
            const currentUsers = users.length; // Get the current number of users
            const maxPlayers = this.maxPlayers; // Get the max players value (you might already have this in your context)
            
            // Update the users count element with the new value
            document.getElementById('users-count').textContent = `${currentUsers}/${maxPlayers}`;
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