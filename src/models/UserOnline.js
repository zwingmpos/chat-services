const mongoose = require("mongoose");

const UserOnlineSchema = new mongoose.Schema({
    userId: {type: String, required: true, unique: true},
    socketId: {type: String, required: true},
    isOnline: {type: Boolean, default: false},
    updatedAt: {type: Date, default: Date.now},
});

const UserOnline = mongoose.model("UserOnline", UserOnlineSchema);
module.exports = UserOnline;
