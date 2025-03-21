const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    mobile_number: {type: String, unique: true, required: true},
    name: {type: String, required: true},
    email: {type: String, unique: true},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('User', userSchema);
