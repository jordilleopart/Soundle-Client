const config = {
    address: "http://localhost:3000",
    websocketBaseAddress: "ws://localhost:3000/game"
}

class WebSocketManager {
    constructor() {
        if (WebSocketManager.instance) {
            return WebSocketManager.instance;  // Singleton pattern
        }
        this.socket = null;  // WebSocket instance
        WebSocketManager.instance = this;
    }

    // Initialize webSocket to a lobbyId
    connect(lobbyId) {

        // Get the JWT token from local storage
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

        this.socket.onmessage = (event) => {
            console.log(event);
            this.handleMessage(event);
        };
    }

    // Subscribe to a specific type of message --> established action to perform when receiving a message of certain type
    onMessage(type, handler) {
        if (!this.eventHandlers[type]) {
            this.eventHandlers[type] = [];
        }
        this.eventHandlers[type].push(handler);
    }

    // Process incoming messages and trigger the appropriate handler
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);  // Parse the incoming message
            const { type, content, author } = message;  // Extract message properties

            // Check if there are any handlers for this type
            if (this.eventHandlers[type]) {
                // Call each handler for this type of message
                this.eventHandlers[type].forEach(handler => {
                    handler({ type, content, author });
                });
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    // Send a message to the server through the WebSocket
    sendMessage(type, content) {
        if (this.socket) {
            const message = { "type": type, "content": content };
            this.socket.send(JSON.stringify(message));
        } else {
            console.log('WebSocket is not connected');
        }
    }

    // Disconnect WebSocket connection
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

// Attach WebSocketManager to the global window object for global access
window.WebSocketManager = new WebSocketManager();
