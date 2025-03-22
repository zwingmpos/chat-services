const UserOnline = require('../models/UserOnline');

class UserOnlineManager {
    static async updateUserStatus(userId, isOnline, socketId = null) {
        try {
            await UserOnline.findOneAndUpdate(
                {userId},
                {socketId, isOnline, updatedAt: new Date()},
                {upsert: true, new: true}
            );
            console.log(`${isOnline ? '🟢' : '🔴'} User ${isOnline ? 'connected' : 'disconnected'}: ${userId}`);
            return {success: true};
        } catch (error) {
            console.error(`❌ Error updating user ${isOnline ? 'online' : 'offline'} status:`, error);
            return {success: false, error};
        }
    }
}

module.exports = UserOnlineManager;
