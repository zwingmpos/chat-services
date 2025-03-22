const Chat = require('../models/Chat');
const ChatRoom = require('../models/ChatRoom');
const mongoose = require('mongoose');

const getChatHistory = async (req, res) => {
    const {senderId, receiverId, page = 1, limit = 1} = req.query;

    if (!senderId || !receiverId) {
        return res.status(200).json({status: 'fail', message: 'Sender and Receiver IDs are required'});
    }

    try {
        // Find the chat room
        const chatRoom = await ChatRoom.findOne({users: {$all: [senderId, receiverId]}});

        if (!chatRoom) {
            return res.status(200).json({chatRoomId: null, chats: []});
        }

        const chatRoomId = new mongoose.Types.ObjectId(chatRoom._id);

        // Get total message count for pagination metadata
        const totalDocuments = await Chat.countDocuments({chatRoomId});

        // Fetch chat history in descending order (latest messages first) and paginate
        const chatDocuments = await Chat.find({chatRoomId})
            .sort({date: -1}) // Latest first
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        if (!chatDocuments.length) {
            return res.status(200).json({
                status: "success",
                chatRoomId,
                createdAt: chatRoom.createdAt,
                chats: [],
                currentPage: parseInt(page),
                totalDocuments
            });
        }

        // Reverse the order of messages for proper chronological display
        const reversedChatDocuments = chatDocuments.reverse();

        // Format the response
        let formattedChats = [];
        let lastDate = null;

        reversedChatDocuments.forEach(doc => {
            const messageDate = new Date(doc.date).toISOString().split("T")[0];

            if (messageDate !== lastDate) {
                formattedChats.push({type: "date", value: formatDate(doc.date)});
                lastDate = messageDate;
            }

            doc.messages.forEach(msg => {
                formattedChats.push({
                    type: msg.senderId === senderId ? "sender" : "receiver",
                    message: msg.text,
                    messageType: msg.attachment ? "attachment" : "text",
                    messageId: msg._id,
                    attachment: msg.attachment || null,
                    time: formatTime(msg.timestamp),
                });
            });
        });

        return res.status(200).json({
            status: "success",
            chatRoomId,
            createdAt: chatRoom.createdAt,
            chats: formattedChats,
            currentPage: parseInt(page),
            totalDocuments
        });
    } catch (error) {
        console.error('❌ Error fetching chat history:', error);
        return res.status(500).json({status: 'error', message: 'Server Error'});
    }
};

const storeOfflineMessage = async (req, res) => {
    const {senderId, receiverId, message, attachment} = req.body;

    if (!senderId || !receiverId) {
        return res.status(200).json({
            status: 'fail',
            message: 'senderId and receiverId are required.',
        });
    }

    if (!text && !attachment) {
        return res.status(200).json({
            status: 'fail',
            message: 'Either text or attachment is required.',
        });
    }

    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        // 🆕 Find or Create ChatRoom
        let chatRoom = await ChatRoom.findOne({users: {$all: [senderId, receiverId]}});

        if (!chatRoom) {
            console.log(`🆕 Creating new chat room`);
            chatRoom = new ChatRoom({
                users: [senderId, receiverId],
                createdAt: new Date(),
            });
            await chatRoom.save();
        }

        // ✅ Ensure chatRoomId is correctly assigned
        const chatRoomId = chatRoom._id;

        // 🗂️ Find or Create Chat Document for Today
        let chatDocument = await Chat.findOne({chatRoomId, date});

        if (!chatDocument || chatDocument.messages.length >= 500) {
            chatDocument = new Chat({chatRoomId, date, messages: []});
        }

        const attachmentObj = attachment
            ? {
                url: attachment.url,
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                uploadedAt: attachment.uploadedAt || new Date(),
            }
            : null;

        // Create chat message
        const newMessage = {
            senderId,
            receiverId,
            text: message || null,
            attachment: attachmentObj,
            timestamp: new Date(),
        };

        // 🗳️ Add new message and save
        chatDocument.messages.push(newMessage);
        await chatDocument.save();

        await ChatRoom.findByIdAndUpdate(chatRoom._id, {$inc: {totalMessages: 1}});

        return res.status(200).json({
            status: 'success',
            message: 'Message stored for offline user',
            data: newMessage,
        });
    } catch (error) {
        console.error('❌ Error storing offline message:', error);
        return res.status(500).json({
            status: 'error',
            message: '❌ Internal Server Error',
        });
    }
};

// Format date to "18 March 2025"
const formatDate = (dateString) => {
    // return new Date(dateString).toLocaleDateString("en-GB", {day: "numeric", month: "long", year: "numeric"});

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const messageDate = new Date(dateString);
    const today = new Date();

    // Normalize times to 00:00:00 to compare only dates
    today.setHours(0, 0, 0, 0);
    messageDate.setHours(0, 0, 0, 0);

    const timeDifference = today - messageDate;
    const dayDifference = timeDifference / (1000 * 60 * 60 * 24);

    // Case 1: Today
    if (dayDifference === 0) {
        return 'Today';
    }

    // Case 2: Yesterday
    if (dayDifference === 1) {
        return 'Yesterday';
    }

    // Case 3: Same week but not today or yesterday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Sunday of the current week

    if (messageDate >= weekStart) {
        return daysOfWeek[messageDate.getDay()];
    }

    // Case 4: Older than the current week
    return messageDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).replace(" AM", " am").replace(" PM", " pm");
};

// ✅ Correct Export
module.exports = {getChatHistory, storeOfflineMessage};