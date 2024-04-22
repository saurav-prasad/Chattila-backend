const mongoose = require('mongoose');
const { Schema } = require("mongoose");

const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    profilePhoto: {
        type: String,
    },
})

module.exports = mongoose.model('chattila-user', userSchema) 