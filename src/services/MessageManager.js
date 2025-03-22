const UserOnlineManager = require('./UserOnlineManager');
const ChatRoomManager = require('./ChatRoomManager');
const ChatRoom = require('../models/ChatRoom');
const Chat = require('../models/Chat');

class MessageManager {
    static async sendMessage(socket, senderId, receiverId, message, attachment) {
        if (!senderId || !receiverId || (!message?.trim() && !attachment)) return;

        try {
            const chatRoom = await ChatRoomManager.joinPrivateRoom(socket, senderId, receiverId);
            const date = new Date().toISOString().split('T')[0];

            const attachmentObj = attachment ? {
                url: attachment.url,
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                uploadedAt: attachment.uploadedAt || new Date(),
            } : null;

            const chatMessage = {
                senderId,
                receiverId,
                text: message || null,
                attachment: attachmentObj,
                timestamp: new Date()
            };

            let chatDocument = await Chat.findOne({chatRoomId: chatRoom._id, date});

            if (!chatDocument || chatDocument.messages.length >= 500) {
                chatDocument = new Chat({chatRoomId: chatRoom._id, date, messages: []});
            }

            chatDocument.messages.push(chatMessage);
            await chatDocument.save();

            await ChatRoom.findByIdAndUpdate(chatRoom._id, {$inc: {totalMessages: 1}});

            await MessageManager.notifyReceiver(receiverId, 'userStoppedTyping', {senderId});
            await MessageManager.notifyReceiver(receiverId, 'receiveMessage', chatMessage);
            await MessageManager.notifyReceiver(senderId, 'messageDelivered', chatMessage);

            console.log(`📩 Message Sent from ${senderId} to ${receiverId}:`, message);
        } catch (error) {
            console.error("❌ Error storing chat message:", error);
        }
    }

    static async notifyReceiver(userId, event, payload) {
        try {
            const socketUser = await UserOnlineManager.getUserOnline(userId);
            if (socketUser?.socketId) {
                io.to(socketUser.socketId).emit(event, payload);
            }
        } catch (error) {
            console.error(`❌ Error notifying user ${userId} for ${event}:`, error);
        }
    }
}

module.exports = MessageManager;