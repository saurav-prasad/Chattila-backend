const express = require('express')
const router = express.Router()
const fetchUser = require('../middleware/fetchUser.js')
const groupSchema = require('../schema/group')
const userSchema = require('../schema/user')
const messageSchema = require('../schema/message')
const { body, validationResult, check } = require('express-validator')
const group = require('../schema/group')

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
            const userId = req.userId

            // check if the group name already exist
            const checkGrp = await groupSchema.findOne({ groupName })
            if (checkGrp) {
                success = false
                return res.status(400).send({ success, message: "Group name already taken" })
            }

            // if not exist create a new group
            const group = await groupSchema.create({ groupName, members: [userId], admin: [userId] })
            success = true
            res.send({
                success, message: "Group created successfully",
                data: {
                    ...group._doc
                }
            })
        } catch (error) {
            success = false
            return res.status(500).send({ success, message: 'Internal server error occurred' })
        }
    })

// add a new group admin -> Delete /group/addadmin/:newadminid/:groupid
router.post('/addadmin/:newadminid/:groupid', fetchUser,
    async (req, res) => {
        let success
        const userId = req.userId
        const newAdminId = req.params.newadminid
        const groupId = req.params.groupid
        try {
            // find the group detail from the database
            const group = await groupSchema.findById(groupId)

            // if group doesnot exist
            if (!group) {
                success = false
                return res.status(400).send({ success, message: "Group doesnot exist" })
            }
            // admin conformation
            const isAdmin = group.admin.findIndex(memberId => memberId.toString() === userId.toString());
            if (isAdmin === -1) {
                success = false
                return res.status(400).send({ success, message: "Not allowed" })
            }

            // check newAdminId
            const checkNewAdmin = await userSchema.findById(newAdminId)
            if (!checkNewAdmin) {
                success = false
                return res.status(400).send({ success, message: "Invalid new admin id" })
            }

            // check if the new admin already exist
            const isNewAdminExist = group.admin.findIndex(memberId => memberId.toString() === checkNewAdmin.id.toString());
            // console.log(isNewAdminExist);
            if (isNewAdminExist !== -1) {
                success = false
                return res.status(400).send({ success, message: "Already assigned as admin" })
            }

            // Update the group with new admin
            const updatedGroup = await groupSchema.findByIdAndUpdate(
                groupId,
                { $addToSet: { admin: newAdminId } },
                { new: true }
            );

            success = true
            res.send({ success, message: "New admin added", data: { ...updatedGroup._doc } })
        } catch (error) {
            console.log(error);
            success = false;
            return res.status(500).send({ success, message: "Internal server error occurred" })
        }
    }
)

// Remove an admin -> DELETE /group/removeadmin/:adminid/:groupid
router.delete('/removeadmin/:adminid/:groupid', fetchUser,
    async (req, res) => {
        let success;
        const groupId = req.params.groupid
        const adminId = req.params.adminid
        const userId = req.userId

        // Check if group ID and admin ID are provided
        if (!groupId || !adminId) {
            success = false;
            return res.status(400).send({ success, message: "Group ID and Admin ID are required" });
        }
        try {
            // Find the group detail from the database
            const group = await groupSchema.findById(groupId);

            // if group doesnot exists
            if (!group) {
                success = false;
                return res.status(400).send({ success, message: "Group does not exist" });
            }

            // admin conformation
            const isAdmin = group.admin.findIndex(memberId => memberId.toString() === userId.toString());
            if (isAdmin === -1) {
                success = false
                return res.status(400).send({ success, message: "You are not an Admin" })
            }

            if (group.admin.length === 1) {
                success = false
                return res.status(400).send({ success, message: "Atleast one admin required" })
            }
            // check if the user is an admin of the group
            const isAdminExistToRemove = group.admin.findIndex(memberId => memberId.toString() === adminId.toString());
            if (isAdminExistToRemove === -1) {
                success = false
                return res.status(400).send({ success, message: "User is not an admin" })
            }


            // Remove the admin from the group
            const updatedGroup = await groupSchema.findByIdAndUpdate(
                groupId,
                { $pull: { admin: adminId } }, // Use $pull to remove userIdToRemove from the admin array
                { new: true }
            );

            success = true;
            res.send({ success, message: "Admin removed from the admin list", data: { ...updatedGroup._doc } });

        } catch (error) {
            console.log(error);
            success = false
            return res.status(500).send({ success, message: 'Internal server error occurred' })
        }
    })

// Add group member -> Post /group/addmember/:groupid
router.post('/addmember/:groupid', fetchUser,
    async (req, res) => {
        let success
        const userId = req.userId

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

            // admin conformation
            const isAdmin = group.admin.findIndex(memberId => memberId.toString() === userId.toString());
            if (isAdmin === -1) {
                success = false
                return res.status(400).send({ success, message: "Not allowed" })
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
                groupId,
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

// Remove a member -> DELETE /group/removemember/:groupid/:userid
router.delete('/removemember/:groupid/:userid', fetchUser,
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

            // admin conformation
            const isAdmin = group.admin.findIndex(memberId => memberId.toString() === userId.toString());
            if (isAdmin === -1) {
                success = false
                return res.status(400).send({ success, message: "Not allowed" })
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

// delete a group -> Delete /group/deletegroup/:groupid
router.delete('/deletegroup/:groupid', fetchUser,
    async (req, res) => {
        let success
        const userId = req.userId
        const groupId = req.params.groupid
        try {
            const group = await groupSchema.findById(groupId)

            // Check if group exists
            if (!group) {
                success = false;
                return res.status(400).send({ success, message: "Group doesnot exist" });
            }

            // admin conformation
            const isAdmin = group.admin.findIndex(memberId => memberId.toString() === userId.toString());
            if (isAdmin === -1) {
                success = false
                return res.status(400).send({ success, message: "Not allowed" })
            }

            // delete all the group messages
            const deleteResult = await messageSchema.deleteMany({ group: group._id });

            if (!deleteResult.acknowledged) {
                success = false
                return res.status(400).send({ success, message: "Something went wrong" })
            }
            // delete group
            const deletedGroup = await groupSchema.findByIdAndDelete(groupId)

            success = true
            res.send({ success, message: "Group deleted successfully" })
        } catch (error) {
            success = false
            return res.status(500).send({ success, message: 'Internal server error occurred' })
        }
    })

module.exports = router