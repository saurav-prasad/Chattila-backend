require('dotenv').config()
const jwt = require('jsonwebtoken');

const fetchUser = (req, res, next) => {
    let success

    //checking the auth token received from request header
    const token = req.header('auth-token')
    if (!token) {
        success = false
        return res.status(400).send({ success, message: 'Auth-token is invalid' })
    }
    // if token available, fetch the user
    try {
        const data = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = data.userId
        next()
    } catch (error) {
        success = false
        res.status(500).send({ success, message: "Auth-token is invalid" })
    }
}

module.exports = fetchUser 