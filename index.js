const express = require('express');
const app = express()
require('dotenv').config()

const port = process.env.PORT || 5500

const cors = require('cors');

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
app.use('/message/groupmessage', require('./routes/groupMessages.js'))
app.use('/message/personalmessage', require('./routes/personalMessages.js'))
app.use('/convos', require('./routes/convos.js'))

// server initialization
app.listen(port, (req, res) => {
    console.log(`Server listening on port ${port}`);
})  