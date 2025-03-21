const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('././src/config/db');
const apiRoutes = require('./src/routes/apiRoutes');
const {setupChatSocket} = require('././src/sockets/chatSocket');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT

// Database Connection
connectDB();

// Middleware
app.use(express.json());
app.use('/api/chat', apiRoutes);

// Setup WebSocket
setupChatSocket(io);

server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});