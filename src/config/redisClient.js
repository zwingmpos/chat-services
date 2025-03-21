let redisClient = null;

try {
    const redis = require('redis');

    redisClient = redis.createClient({
        socket: {
            host: '127.0.0.1',
            port: 6379
        }
    });

    // redisClient.on('connect', () => console.log('✅ Connected to Redis'));
    // redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

    // redisClient.connect();
} catch (err) {
    console.log('❌ Redis is disabled.');
    redisClient = null;
}

module.exports = redisClient;
