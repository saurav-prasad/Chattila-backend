const express = require('express')
const router = express.Router()
const fetchUser = require('../middleware/fetchUser.js')
const groupSchema = require('../schema/group')
const { body, validationResult, check } = require('express-validator')

// Create a new group -> POST /group/creategroup
router.post('/creategroup', fetchUser,
    [
        body('groupName', 'Group name should be atleast of 1 characters long').isLength({ min: 1 })
    ],
    async (req, res) => {
        let success

        // validate request body
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            success = false
            return res.status(400).send({ success, message: errors.array()[0].msg })
        }

        try {
            const { groupName } = req.body

            // check if the group name already exist
            const checkGrp = await groupSchema.findOne({ groupName })
            if (checkGrp) {
                success = false
                return res.status(400).send({ success, message: "Group name already taken" })
            }

            // if not exist create a new group
            const group = await groupSchema.create({ groupName })
            success = true
            res.send({
                success, message: "Group created successfully",
                data: {
                    id: group._id,
                    groupName: group.groupName
                }
            })
        } catch (error) {
            success = false
            return res.status(500).send({ success, message: 'Internal server error occurred' })
        }
    })

// Add group member -> Post /group/addmember
router.post('/addmember/:id', fetchUser,
    async (req, res) => {
        let success
        const groupId = req.params.id
        // if group id not available
        if (!groupId) {
            success = false
            return res.status(400).send({ success, message: "Group id required" })
        }
        const { members } = req.body
        try {
            console.log(members);
            // find the group detail from the database
            const group = await groupSchema.findById(groupId)

            // if group doesnot exist
            if (!group) {
                success = false
                return res.status(400).send({ success, message: "Group doesnot exist" })
            }

            // if exist

            res.send({ group, members })
        } catch (error) {
            success = false;
            return res.status(500).send({ success, message: "Internal server error occurred" })
        }
    })

module.exports = router