const express = require('express');
const router = express.Router()
const userSchema = require('../schema/user');
const { body, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const jwtSecret = process.env.JWT_SECRET
const fetchUser = require('../middleware/fetchUser.js')

// Create a new user -> POST /auth/createuser
router.post('/createuser',
    [
        body('email', 'Please enter a valid email').isEmail(),
        body('username', 'Username should be atleast of 3 characters long').isLength({ min: 3 }),
        body('password', 'Password should be atleast of 6 characters long').isLength({ min: 6 })
    ],
    async (req, res) => {
        let success;
        // request body validation
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            success = false
            return res.status(400).send({ message: errors.array()[0].msg, success })
        }

        try {
            const { username, email, password } = req.body

            // checking the username
            const userUsername = await userSchema.findOne({ username })

            // if exist
            if (userUsername) {
                success = false
                return res.status(400).send({ success, message: "Username already exist" })
            }

            // checking the email
            const userEmail = await userSchema.findOne({ email })

            // if exist
            if (userEmail) {
                success = false
                return res.status(400).send({ success, message: "Email already exist" })
            };

            // hashing the password
            const salt = await bcryptjs.genSalt(10)
            const hashedPassword = await bcryptjs.hash(password, salt)

            // adding the user to the database
            const newUser = await userSchema.create({
                email,
                password: hashedPassword,
                username,
                profilePhoto: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
            })

            // generate token
            const token = jwt.sign({
                userId: newUser._id,
            }, jwtSecret)

            success = true
            res.send({
                success, message: "User created successfully", data: {
                    email,
                    username,
                    id: newUser._id,
                    profilePhoto: newUser.profilePhoto,
                    token
                }
            });
        } catch (error) {
            success = false
            res.status(500).send({ message: "Internal server error occured", success })
        }
    })

// Login a user -> POST /auth/loginuser
router.post('/loginuser',
    [
        body('email', 'Please enter a valid email').isEmail(),
        body('password', 'Password should be atleast of 6 characters long').isLength({ min: 6 })
    ],
    async (req, res) => {
        let success;
        // request body validation
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            success = false
            console.log(req.body);
            console.log(errors);
            return res.status(400).send({ message: errors.array()[0].msg, success })
        }

        try {
            const { email, password } = req.body

            // checking the email
            const user = await userSchema.findOne({ email })

            // if doesnot exist
            if (!user) {
                success = false
                return res.status(400).send({ success, message: "Email doesnot exist" })
            };

            // decrypt the password & checking the password
            const decryptedPassword = await bcryptjs.compare(password, user.password)

            // if doesnot exist
            if (!decryptedPassword) {
                success = false
                return res.status(400).send({ success, message: "Incorrect password!" })
            };

            // generate token
            const token = jwt.sign({
                userId: user._id,
            }, jwtSecret)

            success = true
            res.send({
                success, message: "Logged-in successfully", data: {
                    email,
                    username: user.username,
                    id: user._id,
                    profilePhoto: user.profilePhoto,
                    token
                }
            });
        } catch (error) {
            success = false
            res.status(500).send({ message: "Internal server error occured", success })
            console.log(error);
        }
    })


// Fetch a user using auth-token -> GET /auth/fetchuser
router.get('/fetchuser', fetchUser,
    async (req, res) => {
        try {
            let userId = req.userId;

            // checking the userId
            const user = await userSchema.findById(userId)

            // if user notfound
            if (!user) {
                success = false
                return res.status(400).send({ message: "Something went wrong", success })
            }

            success = true
            res.send({
                success, message: "Logged-in successfully", data: {
                    email: user.email,
                    username: user.username,
                    id: user._id,
                    profilePhoto: user.profilePhoto,
                }
            });
        } catch (error) {
            success = false
            res.status(500).send({ message: "Internal server error occured", success })
        }
    })

// Get a user data  -> GET /auth/getuserdata
router.get('/getuserdata/:id', fetchUser,
    async (req, res) => {
        try {
            const userId = req.params.id

            // checking the userId
            const user = await userSchema.findById(userId)

            // if user notfound
            if (!user) {
                success = false
                return res.status(400).send({ message: "Something went wrong", success })
            }

            success = true
            res.send({
                success, message: "User found", data: {
                    username: user.username,
                    id: user._id,
                    profilePhoto: user.profilePhoto,
                }
            });
        } catch (error) {
            success = false
            res.status(500).send({ message: "Internal server error occured", success })
        }
    })


module.exports = router