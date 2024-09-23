const mongoose = require('mongoose')
const { Schema } = require("mongoose");

const groupMessageSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'chattila-users',
        required: true
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'chattila-groups'
    },
    readBy: [
        {
            type: Schema.Types.ObjectId,
            ref: 'chattila-users'
        }
    ],
    timestamp: {
        type: Date,
        default: () => Date.now(),
        required: true
    },
})

module.exports = mongoose.model('chattila-message', groupMessageSchema)