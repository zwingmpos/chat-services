const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    users: [String],
    totalMessages: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now}, // Store creation date
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
