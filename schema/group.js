const mongoose = require('mongoose');
const { Schema } = require("mongoose");

const groupSchema = new Schema({
    groupName: {
        type: String,
        required: true
    },
    members: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'chattila-users'
        }
    ]
})

module.exports = mongoose.model('chattila-group', groupSchema)