const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    chatRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD format
    messages: [
        {
            senderId: String,
            receiverId: String,
            text: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
});

module.exports = mongoose.model('Chat', chatSchema);