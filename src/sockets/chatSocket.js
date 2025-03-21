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

        console.log(`🔵 User connected: ${userId} - `, socket.id);

        try {
            // Store user's online status in MongoDB
            const result = await UserOnline.findOneAndUpdate(
                {userId},
                {socketId: socket.id, isOnline: true, updatedAt: new Date()},
                {upsert: true, new: true}
            );
        } catch (error) {
            console.error("❌ Error updating user online status:", error);
        }

        // Handle "joinRoom" event
        socket.on('joinRoom', async ({senderId, receiverId}) => {
            if (!senderId || !receiverId) return;

            try {
                let chatRoom = await ChatRoom.findOne({users: {$all: [senderId, receiverId]}});

                if (!chatRoom) {
                    console.log(`🆕 Creating new chat room`);
                    chatRoom = new ChatRoom({users: [senderId, receiverId]});
                    await chatRoom.save();
                }

                socket.join(chatRoom._id.toString());
                console.log(`✅ User ${senderId} joined room: ${chatRoom._id}`);
            } catch (error) {
                console.error("❌ Error joining room:", error);
            }
        });

        // Handle "typing" event
        socket.on('typing', async ({senderId, receiverId}) => {
            if (!senderId || !receiverId) return;

            try {
                const receiver = await UserOnline.findOne({userId: receiverId});
                if (receiver && receiver.socketId) {
                    io.to(receiver.socketId).emit('userTyping', {senderId});
                    console.log(`✍️ User ${senderId} is typing... Notified ${receiverId}`);
                }
            } catch (error) {
                console.error("❌ Error in typing event:", error);
            }
        });

        // Handle "stop typing" event
        socket.on('stopTyping', async ({senderId, receiverId}) => {
            if (!senderId || !receiverId) return;

            try {
                const receiver = await UserOnline.findOne({userId: receiverId});
                if (receiver && receiver.socketId) {
                    io.to(receiver.socketId).emit('userStoppedTyping', {senderId});
                    console.log(`✋ User ${senderId} stopped typing. Notified ${receiverId}`);
                }
            } catch (error) {
                console.error("❌ Error in stopTyping event:", error);
            }
        });

        // Handle "sendMessage" event
        socket.on('sendMessage', async ({senderId, receiverId, message}) => {
            if (!senderId || !receiverId || !message) return;

            try {
                let chatRoom = await ChatRoom.findOne({users: {$all: [senderId, receiverId]}});

                if (!chatRoom) {
                    console.log(`🆕 Creating new chat room`);
                    chatRoom = new ChatRoom({users: [senderId, receiverId]});
                    await chatRoom.save();
                }

                const date = new Date().toISOString().split('T')[0];
                const chatMessage = {senderId, receiverId, text: message, timestamp: new Date()};

                let chatDocument = await Chat.findOne({chatRoomId: chatRoom._id, date});

                if (!chatDocument || chatDocument.messages.length >= 500) {
                    chatDocument = new Chat({chatRoomId: chatRoom._id, date, messages: []});
                }

                chatDocument.messages.push(chatMessage);
                await chatDocument.save();

                // Notify receiver
                const receiver = await UserOnline.findOne({userId: receiverId});
                if (receiver && receiver.socketId) {
                    io.to(receiver.socketId).emit('userStoppedTyping', {senderId});
                    io.to(receiver.socketId).emit('receiveMessage', chatMessage);
                }

                console.log(`📩 Message Sent from ${senderId} to ${receiverId}:`, message);
            } catch (error) {
                console.error("❌ Error storing chat message:", error);
            }
        });

        // Handle User Disconnection
        socket.on('disconnect', async () => {
            console.log(`🔴 User disconnected: ${userId}`);

            try {
                await UserOnline.findOneAndUpdate(
                    {userId},
                    {isOnline: false, socketId: null, updatedAt: new Date()}
                );
                console.log(`✅ User ${userId} marked offline`);
            } catch (error) {
                console.error("❌ Error updating user offline status:", error);
            }
        });
    });
};

module.exports = {setupChatSocket};