const mongoose = require('mongoose')
const { Schema } = require("mongoose");

const messageSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'chattila-users',
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'chattila-users'
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
    isRead: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: () => Date.now(),
        required: true
    },
})

module.exports = mongoose.model('chattila-message', messageSchema)