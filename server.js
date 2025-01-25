const express = require('express');
const http = require('http');
// const socketIo = require('socket.io');
const cors = require('cors');



const app = express();
app.use(cors({
  origin: "http://localhost:3000, http://192.168.8.103:19006/", // Frontend origin
  methods: ["GET", "POST"]
}));
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend origin
    methods: ["GET", "POST"]
  },
});


const users = {}; // Store users and their socket IDs

// Handle socket connections
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Register user with user ID
    socket.on('register', (userId) => {
        users[userId] = socket.id;  // Save user and socket ID
        console.log(`${userId} registered with socket ID: ${socket.id}`);
    });

    // Handle call initiation from web (frontend)
    socket.on('initiate-call', ({ callerId, receiverId }) => {
        console.log(`Initiating call from ${callerId} to ${receiverId}`);
        if (users[receiverId]) {
            io.to(users[receiverId]).emit('incoming-call', { callerId });  // Emit call event to receiver
        } else {
            console.log(`Receiver ${receiverId} not available`);
            io.to(users[callerId]).emit('not-registered', { receiverId });
        }
    });

    // Handle call acceptance
    socket.on('accept-call', ({ callerId, receiverId }) => {
        console.log(`${receiverId} accepted the call from ${callerId}`);
        io.to(users[callerId]).emit('call-accepted', { receiverId });
    });

    // Handle call rejection
    socket.on('reject-call', ({ callerId, receiverId }) => {
        console.log(`${receiverId} rejected the call from ${callerId}`);
        io.to(users[callerId]).emit('call-rejected', { receiverId });
    });

    // user ended call
    socket.on('end-call', ({ callerId, receiverId }) => {
        console.log(`${receiverId} ended the call from ${callerId}`);
        io.to(users[callerId]).emit('call-ended', { receiverId });
    });

    // web ended call
    socket.on('end-call-web', ({ callerId, receiverId }) => {
        console.log(`${callerId} ended the call`);
        io.to(users[receiverId]).emit('call-ended', { callerId });
    });

    // Remove user on disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        for (let userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];  // Remove user from list on disconnect
                console.log(`${userId} removed from user list`);
                break;
            }
        }
    }); 

    // user not registered
    // socket.on('not-registered', ({ callerId, receiverId }) => {
    //     console.log(`User not registered`);
    //     io.to(users[callerId]).emit('not-registered', { receiverId });
    // });
});

server.listen(3001, () => {
    console.log('Server running on port 3001');
});
