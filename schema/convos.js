const { Schema, default: mongoose } = require("mongoose");

const convosSchema = new Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'chattila-users'
    },
    groups: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'chattila-groups'
        }
    ],
    peoples: [
        {
            type: mongoose.Types.ObjectId,
            ref: 'chattila-users'
        }
    ]
})

module.exports = mongoose.model('chattila-convos', convosSchema)