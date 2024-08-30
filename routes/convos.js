const express = require('express')
const router = express.Router()
const fetchUser = require('../middleware/fetchUser')
const convosSchema = require('../schema/convos')
const userSchema = require('../schema/user')
const messageRoute = require('./message')
const deleteMessage = require('../controller/deleteMessage')
router.use('/message', messageRoute)

// Add a user to convos => POST /convos/adduser/:id
router.post('/adduser/:id', fetchUser,
    async (req, res) => {
        let success
        const userId = req.userId
        const userIdToAdd = req.params.id
        // check if the userid is present in params
        if (!userIdToAdd) {
            success = false
            return res.status(400).send({ success, message: "Please provide a userid to add" })
        }
        // check if the userid and useridToadd is the same
        if (userIdToAdd.toString() === userId.toString()) {
            success = false
            return res.status(400).send({ success, message: "You are trying to add yourself!" })
        }
        try {
            // check if the userid is valid
            const checkUserToAdd = await userSchema.findById(userIdToAdd)
            if (!checkUserToAdd) {
                success = false
                return res.status(400).send({ success, message: "Please provide a valid userid to add" })
            }

            // check if the user already exist in convos 
            const checkConvos = await convosSchema.findOne({ user: userId, peoples: { $in: [checkUserToAdd.id] } });
            // console.log(checkConvos);
            if (checkConvos) {
                success = false
                return res.status(400).send({ success, message: "Userid is already in the list" })
            }

            // Update conversations to add the user to the peoples array if not already present
            const updatedConvos = await convosSchema.findOneAndUpdate(
                { user: userId },
                { $addToSet: { peoples: checkUserToAdd.id } },
                { new: true, upsert: true }
            );

            // console.log(updatedConvos);

            success = true
            res.send({
                success, message: "Userid added successfully", data: {
                    ...updatedConvos._doc
                }
            })
        } catch (error) {
            console.log(error);
            success = false
            res.status(500).send({ success, message: "Internal server error occurred" })
        }
    }
)

// remove a user from convos => DELTE /convos/removeuser/:id
router.delete('/removeuser/:id', fetchUser,
    async (req, res) => {
        let success
        const removeUserId = req.params.id
        const userId = req.userId

        // check if the removeUserId is present in params
        if (!removeUserId) {
            success = false
            return res.status(400).send({ success, message: "Please provide a userid to add" })
        }
        // check if the userid and removeUserId is the same
        if (removeUserId.toString() === userId.toString()) {
            success = false
            return res.status(400).send({ success, message: "You are trying to remove yourself!" })
        }
        try {
            // check if the removeUserId is valid
            const checkUserToRemove = await userSchema.findById(removeUserId)
            if (!checkUserToRemove) {
                success = false
                return res.status(400).send({ success, message: "Please provide a valid userid to add" })
            }

            // check if the user exist in convos 
            const checkConvos = await convosSchema.findOne({ user: userId, peoples: { $in: [removeUserId.id] } });
            console.log(checkConvos);
            if (checkConvos) {
                success = false
                return res.status(400).send({ success, message: "Userid doesnot exist in the list" })
            }

            // Update conversations to remove the user from the peoples array
            const updatedConvos = await convosSchema.findOneAndUpdate(
                { user: userId },
                { $pull: { peoples: checkUserToRemove.id } },
                { new: true }
            );

            success = true
            res.send({
                success, message: "Userid removed successfully", data: {
                    ...updatedConvos._doc
                }
            })

        } catch (error) {
            success = false
            res.status(500).send({ success, message: "Internal server error occurred" })
        }
    }
)

// Add a group to convos => POST /convos/addgroup/:id
router.post('/adduser/:id', fetchUser,
    async (req, res) => {
        let success
        const userId = req.userId
        const userIdToAdd = req.params.id
        // check if the userid is present in params
        if (!userIdToAdd) {
            success = false
            return res.status(400).send({ success, message: "Please provide a userid to add" })
        }
        // check if the userid and useridToadd is the same
        if (userIdToAdd.toString() === userId.toString()) {
            success = false
            return res.status(400).send({ success, message: "You are trying to add yourself!" })
        }
        try {
            // check if the userid is valid
            const checkUserToAdd = await userSchema.findById(userIdToAdd)
            if (!checkUserToAdd) {
                success = false
                return res.status(400).send({ success , message: "Please provide a valid userid to add" })
            }

            // check if the user already exist in convos 
            const checkConvos = await convosSchema.findOne({ user: userId, peoples: { $in: [checkUserToAdd.id] } });
            // console.log(checkConvos);
            if (checkConvos) {
                success = false
                return res.status(400).send({ success, message: "Userid is already in the list" })
            }

            // Update conversations to add the user to the peoples array if not already present
            const updatedConvos = await convosSchema.findOneAndUpdate(
                { user: userId },
                { $addToSet: { peoples: checkUserToAdd.id } },
                { new: true, upsert: true }
            );

            // console.log(updatedConvos);

            success = true
            res.send({
                success, message: "Userid added successfully", data: {
                    ...updatedConvos._doc
                }
            })
        } catch (error) {
            console.log(error);
            success = false
            res.status(500).send({ success, message: "Internal server error occurred" })
        }
    }
)
    
module.exports = router