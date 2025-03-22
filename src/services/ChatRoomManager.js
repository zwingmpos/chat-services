const ChatRoom = require('../models/ChatRoom');

class ChatRoomManager {
    static async joinPrivateRoom(socket, senderId, receiverId) {
        try {
            let chatRoom = await ChatRoom.findOne({ users: { $all: [senderId, receiverId] } });
            if (!chatRoom) {
                console.log("🆕 Creating new private chat room for users");
                chatRoom = await new ChatRoom({ users: [senderId, receiverId] }).save();
            }
            socket.join(chatRoom._id.toString());
            console.log(`✅ User ${senderId} joined private room: ${chatRoom._id}`);
            return chatRoom;
        } catch (error) {
            console.error("❌ Error joining private room:", error);
        }
    }
}

module.exports = ChatRoomManager;
