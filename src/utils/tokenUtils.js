const jwt = require('jsonwebtoken');

const generateToken = (payload, secret) => {
    return jwt.sign(payload, secret, {algorithm: 'RS256', expiresIn: '7d'});
};

module.exports = {generateToken};