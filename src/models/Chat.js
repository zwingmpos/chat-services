const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    url: { type: String, required: true },           // File URL
    name: { type: String, required: true },          // File name
    type: { type: String, required: true },          // MIME type (image/png, application/pdf, etc.)
    size: { type: String, required: true },          // File size (e.g., "540KB")
    uploadedAt: { type: Date, default: Date.now },   // Upload timestamp
});

const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },      // Sender user ID
    receiverId: { type: String, required: true },    // Receiver user ID
    text: { type: String, default: '' },             // Optional message text
    attachment: attachmentSchema,                   // Optional attachment object
    timestamp: { type: Date, default: Date.now },    // Message sent time
});

const chatSchema = new mongoose.Schema({
    chatRoomId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    messages: [messageSchema], // Array of messages
});

module.exports = mongoose.model('Chat', chatSchema);
