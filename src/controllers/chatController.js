const Chat = require('../models/Chat');
const ChatRoom = require('../models/ChatRoom');
const mongoose = require('mongoose');

const getChatHistory = async (req, res) => {
    const {senderId, receiverId} = req.query;

    if (!senderId || !receiverId) {
        return res.status(200).json({status: 'fail', message: 'Sender and Receiver IDs are required'});
    }

    try {
        // Find the chat room based on users
        const chatRoom = await ChatRoom.findOne({users: {$all: [senderId, receiverId]}});

        if (!chatRoom || !chatRoom._id) {
            return res.status(200).json({chatRoomId: null, chats: []});
        }

        // Convert `chatRoom._id` to ObjectId before querying
        const chatRoomId = new mongoose.Types.ObjectId(chatRoom._id);

        // Fetch chat history with correct ObjectId format
        const chatDocuments = await Chat.find({chatRoomId}).sort({date: 1}).limit(50);


        if (!chatDocuments.length) {
            return res.status(200).json({chatRoomId, createdAt: chatRoom.createdAt, chats: []});
        }

        // Format the response
        let formattedChats = [];
        let lastDate = null;

        chatDocuments.forEach(doc => {
            const messageDate = new Date(doc.date).toISOString().split("T")[0];

            if (messageDate !== lastDate) {
                formattedChats.push({type: "date", value: formatDate(doc.date)});
                lastDate = messageDate;
            }

            doc.messages.forEach(msg => {
                formattedChats.push({
                    type: msg.senderId === senderId ? "sender" : "receiver",
                    message: msg.text,
                    messageType: "text",
                    messageId: msg._id,
                    time: formatTime(msg.timestamp),
                });
            });
        });

        return res.status(200).json({chatRoomId, createdAt: chatRoom.createdAt, chats: formattedChats});
    } catch (error) {
        console.error('❌ Error fetching chat history:', error);
        return res.status(500).json({status: 'error', message: 'Server Error'});
    }
};

const storeOfflineMessage = async (req, res) => {
    const {senderId, receiverId, message} = req.body;

    if (!senderId || !receiverId || !message) {
        return res.status(200).json({status: 'fail', message: 'All fields are required'});
    }

    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        // Find or Create ChatRoom
        let chatRoom = await ChatRoom.findOne({users: {$all: [senderId, receiverId]}});

        if (!chatRoom) {
            console.log(`🆕 Creating new chat room`);
            chatRoom = new ChatRoom({
                users: [senderId, receiverId],
                createdAt: new Date()
            });
            await chatRoom.save();
        }

        // Ensure chatRoomId is correctly assigned
        const chatRoomId = chatRoom._id; // Correct way to get chat room ID

        // Store message in Chat collection
        let chatDocument = await Chat.findOne({chatRoomId, date});

        if (!chatDocument || chatDocument.messages.length >= 500) {
            chatDocument = new Chat({chatRoomId, date, messages: []});
        }

        const newMessage = {senderId, receiverId, text: message, timestamp: new Date()};
        chatDocument.messages.push(newMessage);
        await chatDocument.save();

        return res.status(200).json({status: 'success', message: 'Message stored for offline user'});

    } catch (error) {
        console.error('❌ Error storing offline message:', error);
        return res.status(500).json({status: 'error', message: 'Server Error'});
    }
};

// Format date to "18 March 2025"
const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GB", {day: "numeric", month: "long", year: "numeric"});
};

// Format time to "12:45"
const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-GB", {hour: "2-digit", minute: "2-digit", hour12: false});
};

// ✅ Correct Export
module.exports = {getChatHistory, storeOfflineMessage};
