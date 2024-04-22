const express = require('express');
const http = require('http');
const { Server } = require('socket.io')
const app = express()
const server = http.createServer(app)
const port = 5000
const cors = require('cors');
const io = new Server(server, {
    cors: {
        origin: "*",
        credentials: true,
        methods: ["GET", "POST"]
    }
})

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

// server initialization
server.listen(port, (req, res) => {
    console.log(`Server listening on port ${port}`);
})  