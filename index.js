const express = require('express');
const http = require('http');
const { Server } = require('socket.io')
const app = express()
const server = http.createServer(app)
const port = 5000
const cors = require('cors');
const io = new Server(server, {
    cors: {
        origin: "*"
    },
})

// Mapping between user IDs and socket IDs
let users = {};

io.on('connection', (socket) => {
    console.log('A user connected')

    socket.on("online", (userId) => {
        console.log(userId);
        // const a = { ...users, receiver: userId }
        if (userId) {
            users[userId] = socket.id
        }
    })

    socket.on('join', ({ userId, roomId }) => {
        console.log({ userId, roomId });
        console.log("room join");
        // Associate the user ID with the socket ID
        if (userId) { users[userId] = socket.id; }
        // Join the room
        roomId && socket.join(roomId);
    });

    socket.on('private-message', (data) => {
        console.log(users);
        const { sender, receiver, message } = data;
        const receiverSocketId = users[receiver];
        if (receiverSocketId) {
            // Send the private message to the receiver
            io.to(receiverSocketId).emit('private-message', { sender, message });
        } else {
            // Handle the case where the receiver is not online
            console.log(`User ${receiver} is not online`);
        }
    });

    socket.on('group-message', (data) => {
        const { sender, roomId, message } = data;
        // Send the group message to all users in the room
        io.to(roomId).emit('group-message', { sender, message });
    });

    socket.on('leave-group', (roomId) => {
        // Remove the user from the specified group
        socket.leave(roomId);
        console.log(`User ${socket.id} left group ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Remove the user from the users object when disconnected
        const disconnectedUser = Object.keys(users).find(
            (key) => users[key] === socket.id
        );
        delete users[disconnectedUser];
    });

});

const connectToMongo = require('./db.js');

// connection to the database
connectToMongo()

// middlewares
app.use(express.json())
app.use(cors())

// available routes
app.use('/auth', require('./routes/auth.js'))
app.use('/group', require('./routes/group.js'))
app.use('/message', require('./routes/message.js'))
app.use('/convos', require('./routes/convos.js'))

// server initialization
server.listen(port, (req, res) => {
    console.log(`Server listening on port ${port}`);
})  