const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    users: [String],
    createdAt: { type: Date, default: Date.now }, // Store creation date
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
