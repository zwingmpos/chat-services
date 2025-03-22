const UserOnlineManager = require('../services/UserOnlineManager');
const ChatRoomManager = require('../services/ChatRoomManager');
const MessageManager = require('../services/MessageManager');

class ChatSocketManager {
    static setupChatSocket(io) {
        io.on('connection', async (socket) => {
            const userId = socket.handshake.query.userId;
            if (!userId) {
                console.warn("⚠️ No userId provided, disconnecting socket:", socket.id);
                return socket.disconnect();
            }

            console.log(`🟢 User connected: ${userId} - ${socket.id}`);

            const {success: isUserUpdated} = await UserOnlineManager.updateUserStatus(userId, true, socket.id);
            if (!isUserUpdated) return socket.disconnect();

            socket.on('joinRoom', async ({senderId, receiverId}) => {
                if (senderId && receiverId) await ChatRoomManager.joinPrivateRoom(socket, senderId, receiverId);
            });

            socket.on('typing', ({senderId, receiverId}) => {
                if (senderId && receiverId) MessageManager.notifyUser(receiverId, 'userTyping', {senderId});
            });

            socket.on('stopTyping', ({senderId, receiverId}) => {
                if (senderId && receiverId) MessageManager.notifyUser(receiverId, 'userStoppedTyping', {senderId});
            });

            socket.on('sendMessage', async ({senderId, receiverId, message, attachment}) => {
                await MessageManager.sendMessage(socket, senderId, receiverId, message, attachment);
            });

            socket.on('disconnect', async () => {
                const {success: isUserUpdated} = await UserOnlineManager.updateUserStatus(userId, false);
                if (!isUserUpdated) return;

                socket.broadcast.emit("userOnlineStatus", {userId, isOnline: false});
            });
        });
    }
}

module.exports = ChatSocketManager;
