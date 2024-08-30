const express = require('express');
const router = express.Router()
const fetchUser = require('../middleware/fetchUser.js');
const { body, validationResult } = require('express-validator');
const userSchema = require('../schema/user.js');
const groupSchema = require('../schema/group.js');
const messageSchema = require('../schema/message.js')

// Create a message -> Post /message/createmessage
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
                const checkGroup = await groupSchema.findById(group)
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

            // if group and receiver are present at once
            if (group && receiver) {
                success = false
                return res.status(400).send({ success, message: "Not allowed" })
            }

            const message = await messageSchema.create({ ...messageData })
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

// Delete a message -> Post /message/deletemessage/:id
router.delete('/deletemessage/:messageid', fetchUser,
    async (req, res) => {
        console.log("object");
        let success
        try {
            const userId = req.userId
            const messageId = req.params.messageid
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
            console.log(message);
            success = true
            res.send({ success, message: "Message deleted successfully" })

        } catch (error) {
            console.log(error);
            success = false
            res.status(500).send({ success, message: "Internal server error occurred" })
        }
    }
)

// Update readby -> Post /messages/messagereadby/:messageid/:readerid
router.post('/messagereadby/:messageid/:readerid', fetchUser,
    async (req, res) => {
        let success
        try {
            const userId = req.userId
            const messageId = req.params.messageid
            const readerid = req.params.readerid

            // check if the message exist
            let message = await messageSchema.findById(messageId)

            // if the message doesnot exist
            if (!message) {
                success = false
                return res.status(400).send({ success, message: "Message not found" })
            }

            // check if the reader exist
            let checkReader = await userSchema.findById(readerid)

            // if the reader doesnot exist
            if (!checkReader) {
                success = false
                return res.status(400).send({ success, message: "Reader not found" })
            }

            // if the reader already exist in message's readBy
            let isReadyBy = false;
            message.readBy.forEach((e) => {
                if (e.toString() === readerid) { isReadyBy = true }
            })
            if (isReadyBy) {
                success = false
                return res.status(400).send({ success, message: "User already read the message" })
            }
            // if exist
            const updatedMessage = await messageSchema.findByIdAndUpdate(messageId, { $set: { readBy: [...message.readBy, readerid] } }, { new: true })

            success = true
            res.send({
                success, message: "updated successfully", data: { ...updatedMessage._doc }
            })
        }
        catch (error) {
            success = false
            res.status(500).send({ success, message: "Internal server error occurred" })
        }
    })

// Get all the group messages -> Get /messages/getgroupmessages/:userid
router.get('/getgroupmessages/:userid', fetchUser,
    async (req, res) => {
        let success
        const groupId = req.params.userid
        const userId = req.userId
        try {
            // check if the group id is valid
            const group = await groupSchema.findById(groupId)
            // console.log(group);
            // if doesnot exist 
            if (!group) {
                success = false
                return res.status(400).send({ success, message: "Group doesnot exist" })
            }
            //if exist
            const messages = await messageSchema.find({ group: groupId })
            // if no messages available

            if (!messages) {
                success = true
                return res.send({ success, message: "No messages available", data: {} })
            }
            // if messages exist
            success = true
            res.send({ success, message: "No messages available", data: [...messages] })
        } catch (error) {
            success = false
        }
    }
)

// Get all the personal messages -> Get /messages/getpersonalmessages/:userid
router.get('/getpersonalmessages/:userid', fetchUser,
    async (req, res) => {
        let success
        const receiverId = req.params.userid
        const userId = req.userId
        try {
            // check if the group id is valid
            const receiver = await userSchema.findById(receiverId)
            // console.log(group);
            // if doesnot exist 
            if (!receiver) {
                success = false
                return res.status(400).send({ success, message: "User doesnot exist" })
            }
            //if exist
            const messages = await messageSchema.find({ sender: userId, receiver: receiverId })

            // if no messages available
            if (!messages) {
                success = true
                return res.send({ success, message: "No messages available", data: {} })
            }
            // if messages exist
            success = true
            res.send({ success, message: "No messages available", data: [...messages] })
        } catch (error) {
            success = false
        }
    }
)


module.exports = router