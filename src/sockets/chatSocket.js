const Chat = require('../models/Chat');
const ChatRoom = require('../models/ChatRoom');
const UserOnline = require('../models/UserOnline');

const setupChatSocket = (io) => {
    io.on('connection', async (socket) => {
        const userId = socket.handshake.query.userId;
        if (!userId) {
            console.warn("⚠️ No userId provided, disconnecting socket:", socket.id);
            return socket.disconnect();
        }

        console.log(`🟢 User connected: ${userId} - ${socket.id}`);

        try {
            const existingUser = await UserOnline.findOne({userId});
            if (!existingUser || !existingUser.isOnline) {
                await UserOnline.findOneAndUpdate(
                    {userId},
                    {socketId: socket.id, isOnline: true, updatedAt: new Date()},
                    {upsert: true, new: true}
                );
                socket.broadcast.emit("userOnlineStatus", {userId, isOnline: true});
            }
        } catch (error) {
            console.error("❌ Error updating user online status:", error);
        }

        // Ensure the chat room is unique to the pair of users (private room)
        const joinPrivateRoom = async (senderId, receiverId) => {
            try {
                // Check if chat room exists for this unique pair of users
                let chatRoom = await ChatRoom.findOne({users: {$all: [senderId, receiverId]}});

                // If no room exists, create a new one
                if (!chatRoom) {
                    console.log("🆕 Creating new private chat room for users");
                    chatRoom = await new ChatRoom({users: [senderId, receiverId]}).save();
                }

                // Join the room using the unique room ID
                socket.join(chatRoom._id.toString());
                console.log(`✅ User ${senderId} joined private room: ${chatRoom._id}`);
                return chatRoom;
            } catch (error) {
                console.error("❌ Error joining private room:", error);
            }
        };

        const notifyReceiver = async (receiverId, event, payload) => {
            try {
                const receiver = await UserOnline.findOne({userId: receiverId});
                if (receiver?.socketId) io.to(receiver.socketId).emit(event, payload);
            } catch (error) {
                console.error(`❌ Error notifying receiver ${receiverId} for ${event}:`, error);
            }
        };

        socket.on('joinRoom', async ({senderId, receiverId}) => {
            if (senderId && receiverId) await joinPrivateRoom(senderId, receiverId);
        });

        socket.on('typing', ({senderId, receiverId}) => {
            if (senderId && receiverId) notifyReceiver(receiverId, 'userTyping', {senderId});
        });

        socket.on('stopTyping', ({senderId, receiverId}) => {
            if (senderId && receiverId) notifyReceiver(receiverId, 'userStoppedTyping', {senderId});
        });

        socket.on('sendMessage', async ({senderId, receiverId, message, attachment}) => {
            if (!senderId || !receiverId || (!message?.trim() && !attachment)) return;

            try {
                const chatRoom = await joinPrivateRoom(senderId, receiverId);
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

                await notifyReceiver(receiverId, 'userStoppedTyping', {senderId});
                await notifyReceiver(receiverId, 'receiveMessage', chatMessage);

                console.log(`📩 Message Sent from ${senderId} to ${receiverId}:`, message);
            } catch (error) {
                console.error("❌ Error storing chat message:", error);
            }
        });

        socket.on('disconnect', async () => {
            console.log(`🔴 User disconnected: ${userId}`);

            try {
                await UserOnline.findOneAndUpdate(
                    {userId},
                    {isOnline: false, socketId: null, updatedAt: new Date()}
                );

                socket.broadcast.emit("userOnlineStatus", {userId, isOnline: false});

                console.log(`🔴 User ${userId} marked offline`);
            } catch (error) {
                console.error("❌ Error updating user offline status:", error);
            }
        });
    });
};

module.exports = {setupChatSocket};