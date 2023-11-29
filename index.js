import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

const io = new Server(28555);

const authenticatedClients = {
    hub: new Map(), // Using Map to associate IDs with sockets
    web: new Map(),
};

const authenticateClient = (key, clientType) => {
    // Simulated authentication logic (Replace this with your actual authentication mechanism)
    return key === '88VyeXQRmjjNgTJUijAsxxtSw1mtaDDr' && (clientType === 'hub' || clientType === 'web');
};

io.on('connection', (socket) => {
    console.log('[INFO] A client has connected!');

    socket.on('authentication', (data) => {
        const { id, key, client_type: clientType } = data;
        const isAuthenticated = authenticateClient(key, clientType);
        
        if (isAuthenticated) {
            console.log('[INFO] Client authenticated successfully as', clientType, 'with ID', id);

            socket.emit('authenticated', { status: 'success', id });

            // Store authenticated sockets by client_type along with their IDs
            authenticatedClients[clientType].set(id, socket);

            socket.on('message', (messageData) => {
                //const jsonData = JSON.parse(messageData);
                //const id = jsonData["id"];
                console.log("[INFO] RX -> ", messageData.id);
                console.log("[INFO] RX -> ", messageData.command);
                sendMessageToClient('hub', messageData.id , messageData.command); // Send to Specific Shock Hub
                //io.emit('message', messageData); // Broadcast the message to all connected clients
            });

            socket.on('disconnect', () => {
                console.log('[INFO] Client with ID', id, 'and type', clientType, 'disconnected.');
                authenticatedClients[clientType].delete(id);
            });
        } else {
            console.log('Authentication failed. Disconnecting client.');
            socket.emit('authenticated', { status: 'failure' });
            socket.disconnect(true);
        }
    });
});

// Function to send message to a specific client by ID
const sendMessageToClient = (clientType, clientId, message) => {
    const clientSocket = authenticatedClients[clientType].get(clientId);
    if (clientSocket) {
        clientSocket.emit('message', message);
    } else {
        console.log(`Client with ID ${clientId} and type ${clientType} not found.`);
    }
};

// Function to broadcast message to all 'hub' clients
const broadcastToAllHubs = (message) => {
    authenticatedClients['hub'].forEach((socket) => {
        socket.emit('message', message);
    });
};

// Example usage: sending a message to a specific 'hub' client with ID 'abc123'
//sendMessageToClient('hub', 'abc123', 'This is a message for a specific hub client with ID abc123.');

// Example usage: broadcasting a message to all 'hub' clients
//broadcastToAllHubs('This is a broadcast message for all hub clients.');
