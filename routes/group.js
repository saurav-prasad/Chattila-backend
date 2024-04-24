const express = require('express')
const router = express.Router()
const fetchUser = require('../middleware/fetchUser.js')
const groupSchema = require('../schema/group')
const userSchema = require('../schema/user')
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

// Add group member -> Post /group/addmember/:groupid
router.post('/addmember/:groupid', fetchUser,
    async (req, res) => {
        let success

        // check if the group id is available
        const groupId = req.params.groupid
        if (!groupId) {
            success = false
            return res.status(400).send({ success, message: "Group id required" })
        }
        const { members } = req.body
        try {
            // find the group detail from the database
            const group = await groupSchema.findById(groupId)

            // if group doesnot exist
            if (!group) {
                success = false
                return res.status(400).send({ success, message: "Group doesnot exist" })
            }

            // check if the members array exist in request body
            if (members.length < 1 || !members) {
                success = false
                return res.status(400).send({ success, message: "Members required" })
            }

            // verify the members
            let verifiedMembers = []
            await Promise.all(members.map(async (userId) => {
                const user = await userSchema.findById(userId)
                if (user) verifiedMembers.push(user.id)
            }))

            // filter unique members to add
            const existingMembers = group.members.map(String); // Convert existing member IDs to strings
            const filteredMember = verifiedMembers.filter(userId => !existingMembers.includes(userId));

            // Update the group with unique members
            const updatedGroup = await groupSchema.findOneAndUpdate(
                { _id: groupId },
                { $addToSet: { members: { $each: filteredMember } } },
                { new: true }
            );

            if (updatedGroup) {
                success = true;
                return res.send({ success, message: "Members added successfully", data: { ...updatedGroup._doc } });
            } else {
                success = false;
                return res.status(500).send({ success, message: "Failed to update group" });
            }

        } catch (error) {
            success = false;
            return res.status(500).send({ success, message: "Internal server error occurred" })
        }
    })

// Remove a member -> DELETE /group/deletemember/:groupid/:userid
router.delete('/deletemember/:groupid/:userid', fetchUser,
    async (req, res) => {
        let success;
        const groupId = req.params.groupid
        const userId = req.params.userid

        // Check if group ID and user ID are provided
        if (!groupId || !userId) {
            success = false;
            return res.status(400).send({ success, message: "Group ID and User ID are required" });
        }
        try {
            // Find the group detail from the database
            const group = await groupSchema.findById(groupId);

            // if group doesnot exists
            if (!group) {
                success = false;
                return res.status(400).send({ success, message: "Group does not exist" });
            }

            // Find the user detail from the database
            const user = await userSchema.findById(userId);

            // if user doesnot exists
            if (!user) {
                success = false;
                return res.status(400).send({ success, message: "User does not exist" });
            }

            // Check if the user is a member of the group
            const isMemberIndex = group.members.findIndex(memberId => memberId.toString() === userId.toString());
            if (isMemberIndex === -1) {
                success = false;
                return res.status(400).send({ success, message: "User is not a member of the group" });
            }

            // Remove the user from the group
            group.members.splice(isMemberIndex, 1);
            await group.save();

            success = true;
            res.send({ success, message: "Member removed from the group" });

        } catch (error) {
            success = false
            return res.status(500).send({ success, message: 'Internal server error occurred' })
        }
    })


module.exports = router