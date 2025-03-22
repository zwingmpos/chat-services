const Chat = require('../models/Chat');
const ChatRoom = require('../models/ChatRoom');

// Function to sync message counts in ChatRoom
const syncMessageCounts = async () => {
    const chatRooms = await ChatRoom.find({});

    for (const room of chatRooms) {
        const messageCount = await Chat.aggregate([
            {$match: {chatRoomId: room._id}},
            {$unwind: '$messages'},
            {$count: 'total'},
        ]);

        const totalMessages = messageCount.length ? messageCount[0].total : 0;

        await ChatRoom.findByIdAndUpdate(room._id, {totalMessages});

        console.log(`✅ Synced chatRoom: ${room._id}, Messages: ${totalMessages}`);
    }
};

const syncMessageCountsHandler = async (req, res) => {
    try {
        await syncMessageCounts();
        res.status(200).json({status: 'success', message: 'Message counts synced successfully.'});
    } catch (error) {
        console.error('❌ Error syncing message counts:', error);
        res.status(500).json({message: 'Error syncing message counts.'});
    }
};

module.exports = {syncMessageCountsHandler};