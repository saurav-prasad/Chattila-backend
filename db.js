const mongoose = require('mongoose')
require('dotenv').config()

const connetToMongo = () => {
    mongoose.connect(process.env.MONGO_URI).
        then((e) => {
            // console.log(e);
            console.log("Connected to mongodb");
        }).
        catch((err)=>{
            // console.log(err);
            console.log("Cannot connect to the database");
        })
}

module.exports = connetToMongo