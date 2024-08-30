const messageSchema = require('../schema/message');

const deleteMessage = async (query) => {
    let successResult
    try {
        // delete all the messages
        const deleteResult = await messageSchema.deleteMany(query);
        if (deleteResult) {
            successResult = { success: true, message: "Message deleted successfully" }
        }
        else {
            successResult = { success: false, message: "Couldn't delete messages" }
        }
        return successResult
    } catch (error) {
        console.log(error);
        return { success: false, message: "Couldn't delete messages" }
    }
}

module.exports = deleteMessage