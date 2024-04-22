const express = require('express');
const router = express.Router()
const fetchUser = require('../middleware/fetchUser.js');
const { body, validationResult } = require('express-validator');
const userSchema = require('../schema/user.js');
const groupSchema = require('../schema/group.js');
const messageSchema = require('../schema/message.js')

// Create a message -> post /message/createmessage
router.post('/createmessage', fetchUser,
    [
        body('content', 'Content should be atleast of one characters long').isLength({ min: 1 })
    ],
    async (req, res) => {
        let success

        // check request body
        const errors = validationResult(req)
        if (!errors.isEmpty) {
            success = false
            return res.status(400).send({ success, message: errors.array()[0].msg })
        }
        try {
            const userId = req.userId
            const { content, receiver, group } = req.body

            let messageData = {
                content,
                sender: userId
            }
            // check if the receiver is valid
            if (receiver) {
                const checkReceiver = await userSchema.findById(receiver)
                // if invalid
                if (!checkReceiver) {
                    success = false
                    return res.status(400).send({ success, message: "Receiver not found" })
                }
                messageData = {
                    ...messageData,
                    receiver
                }
            }
            // check if the group is valid
            if (group) {
                const checkGroup = await groupSchema.findById(receiver)
                //if invalid
                if (!checkGroup) {
                    success = false
                    return res.status(400).send({ success, message: "Group not found" })
                }
                messageData = {
                    ...messageData,
                    group
                }
            }
            // if group and receiver are not present
            if (!group && !receiver) {
                success = false
                return res.status(400).send({ success, message: "Please specify the receiver" })
            }

            const message = await messageSchema.create({ ...messageData })
            console.log({ ...messageData });
            success = true
            res.send({
                success, message: "Message created successfully",
                data: {
                    ...messageData,
                    id: message.id
                }
            })
        } catch (error) {
            success = false
            res.status(500).send({ success, message: "Internal server error occurred" })
        }
    }
)

// Delete a message -> /message/deletemessage/:id
router.delete('/deletemessage/:id', fetchUser,
    async (req, res) => {
        let success
        try {
            const userId = req.userId
            const messageId = req.params.id
            // check if the message exist
            let message = await messageSchema.findById(messageId)

            // if the message doesnot exist
            if (!message) {
                success = false
                return res.status(400).send({ success, message: "Message not found" })
            }

            // if the message's senderid and userid not matched
            if (message.sender.toString() !== userId) {
                success = false
                return res.status(400).send({ success, message: "Not allowed" })
            }

            // if matches
            message = await messageSchema.findByIdAndDelete(messageId)
            success = true
            res.send({ success, message: "Message deleted successfully" })

        } catch (error) {
            success = false
            res.status(500).send({ success, message: "Internal server error occurred" })
        }
    }
)



module.exports = router