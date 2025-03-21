// models/PublicKey.js
const mongoose = require('mongoose');

const PublicKeySchema = new mongoose.Schema({
    businessKey: {
        type: String,
        required: true,
        unique: true
    }, // Unique identifier for each third party
    publicToken: {
        type: String,
        required: true
    }, // Token provided by third-party
    createdAt: {
        type: Date,
        default: Date.now
    } // Timestamp when entry is created
});

module.exports = mongoose.model('PublicKey', PublicKeySchema);
