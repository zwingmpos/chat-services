const jwt = require('jsonwebtoken');
const PublicKey = require('../models/PublicKey');

// Load environment variables
require('dotenv').config();

const authenticateRequest = async (req, res, next) => {
    try {
        const businessKey = req.header('Business-Key');
        const token = req.header('Authorization');

        if (!token) {
            return res.status(401).json({
                status: 'token_not_provided',
                message: 'Access Denied: No Token Provided',
            });
        }

        if (businessKey) {
            // 🔹 Third-Party Authentication (Validate Public Token from MongoDB)
            const publicKeyRecord = await PublicKey.findOne({businessKey});

            if (!publicKeyRecord) {
                return res.status(401).json({
                    status: 'invalidate_token',
                    message: 'Invalid Business Key',
                });
            }

            if (publicKeyRecord.publicToken !== token) {
                return res.status(401).json({
                    status: 'invalidate_token',
                    message: 'Invalid Public Token',
                });
            }

            // ✅ Third-party authentication successful
            req.user = {businessKey};
            return next();
        }

        // 🔹 Internal System Authentication (Validate JWT)
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        status: 'session_expired',
                        message: 'JWT Token Expired',
                    });
                }
                return res.status(401).json({
                    status: 'not_validated',
                    message: 'Invalid JWT Token',
                });
            }

            // ✅ Internal authentication successful
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Authentication Error:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
};

module.exports = {authenticateRequest};