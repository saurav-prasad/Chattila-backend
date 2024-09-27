const express = require('express');
const router = express.Router()
const fetchUser = require('../middleware/fetchUser.js');
const { body, validationResult } = require('express-validator');
const userSchema = require('../schema/user.js');
const groupSchema = require('../schema/group.js');
const messageSchema = require('../schema/message.js')

// Create a message -> Post /message/personalmessage/createmessage
router.post('/createmessage', fetchUser,
    [
        body('content', 'Content should be atleast of one characters long').isLength({ min: 1 }),
        body('receiver', 'receiver id required').isLength({ min: 5 })
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
            const { content, receiver } = req.body

            // check if the receiver is valid

            const checkReceiver = await userSchema.findById(receiver)
            // if invalid
            if (!checkReceiver) {
                success = false
                return res.status(400).send({ success, message: "Receiver not found" })
            }

            // if sender and receiver are the same
            if (userId == receiver) {
                success = false
                return res.status(400).send({ success, message: "Not Allowed" })
            }

            const message = await messageSchema.create({ content, receiver, sender: userId })

            success = true
            res.send({
                success, message: "Message created successfully",
                data: {

                    ...message._doc
                }
            })
        } catch (error) {
            success = false
            res.status(500).send({ success, message: "Internal server error occurred" })
        }
    }
)

// Delete a message -> Post /message/personalmessage/:messageid
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

            // check if the reader exist
            let checkReader = await userSchema.findById(readerid)

            // if the reader doesnot exist
            if (!checkReader) {
                success = false
                return res.status(400).send({ success, message: "Reader not found" })
            }

            // if the message doesnot exist
            if (!message) {
                success = false
                return res.status(400).send({ success, message: "Message not found" })
            }
            // if readerid is not present in message receiver
            if (!(message.receiver.toString() === readerid)) {
                success = false
                return res.status(400).send({ success, message: "Not allowed" })
            }

            // if the reader already exist in message

            if (message.isRead) {
                success = false
                return res.status(400).send({ success, message: "User already read the message" })
            }

            // if exist
            const updatedMessage = await messageSchema.findByIdAndUpdate(messageId, { $set: { readBy: true } }, { new: true })

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

//TODO pending routes
// Read all the messages -> Post /messages/readallmessages/:readerid
router.post('/readallmessages/:readerid', fetchUser,
    async (req, res) => {
        let success
        try {
            const userId = req.userId
            const messageId = req.params.messageid
            const readerid = req.params.readerid

            // check if the message exist
            let message = await messageSchema.findById(messageId)

            // check if the reader exist
            let checkReader = await userSchema.findById(readerid)

            // if the reader doesnot exist
            if (!checkReader) {
                success = false
                return res.status(400).send({ success, message: "Reader not found" })
            }

            // if the message doesnot exist
            if (!message) {
                success = false
                return res.status(400).send({ success, message: "Message not found" })
            }
            // if readerid is not present in message receiver
            if (!(message.receiver.toString() === readerid)) {
                success = false
                return res.status(400).send({ success, message: "Not allowed" })
            }

            // if the reader already exist in message

            if (message.isRead) {
                success = false
                return res.status(400).send({ success, message: "User already read the message" })
            }

            // if exist
            const updatedMessage = await messageSchema.findByIdAndUpdate(messageId, { $set: { readBy: true } }, { new: true })

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

// Get all the personal messages -> Get /messages/getpersonalmessages/:userid
router.get('/getmessages/:userid', fetchUser,
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
            const andMessages = await messageSchema.find({ sender: receiverId, receiver: userId })

            if (messages.length === 0 && andMessages.length === 0) {
                success = false
                return res.status(400).send({ success, message: 'No messages found' })
            }
            // console.log("messages", messages);
            // console.log("andMessages", andMessages);
            const allMessages = [...messages, ...andMessages]
            // console.log('allMessages', allMessages);
            // if messages exist
            success = true
            res.send({ success, message: "Messages available", data: [...allMessages] })
        } catch (error) {
            success = false
        }
    }
)

// Get the last received message -> Get /messages/getlastmessage/:userid
router.get('/getlastmessage/:userid', fetchUser,
    async (req, res) => {
        let success
        try {
            const senderId = req.params.userid
            const receiverId = req.userId

            // if sender and receiver are the same
            if (senderId === receiverId) {
                success = false
                return res.status(400).send({ success, message: "Sender and receiver id cannot be same" })
            }

            // check if sender exist
            const ifSenderExist = await userSchema.findById(senderId)
            // if not exist
            if (!ifSenderExist) {
                success = false
                return res.status(400).send({ success, message: "Sender id is not valid" })
            }

            // get all the messages with corresponding userids
            const messages = await messageSchema.find({ sender: senderId, receiver: receiverId })
            const andMessages = await messageSchema.find({ sender: receiverId, receiver: senderId })

            // if no message exist
            if (messages.length === 0 && andMessages.length === 0) {
                success = false
                return res.status(400).send({ success, message: "No messages found" })
            }
            // console.log({ messages: [...messages] });
            // console.log({ andMessages: [...andMessages] });
            const allMessages = [...messages, ...andMessages]

            const lastMessage = allMessages.reduce((min, obj) =>
                new Date(obj.timestamp).getTime() > new Date(min.timestamp).getTime() ? obj : min
            )
            // console.log(lastMessage);

            success = true
            res.send({ success, message: "Last message found", data: { ...lastMessage._doc } })
        } catch (error) {
            success = false
            console.log(error);
            res.status(500).send({ success, message: 'Internal server error occurred!' })
        }
    }
)

module.exports = router