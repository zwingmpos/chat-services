const redisClient = require('./redisClient');

const RedisConfig = {
    async setCache(key, value, expiry = 3600) { // Default expiry: 1 hour
        try {
            const data = JSON.stringify(value);
            await redisClient.setEx(key, expiry, data);
        } catch (error) {
            console.error('❌ Redis Set Cache Error:', error);
        }
    },

    async getCache(key) {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ Redis Get Cache Error:', error);
            return null;
        }
    },

    async deleteCache(key) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error('❌ Redis Delete Cache Error:', error);
        }
    }
};

module.exports = RedisConfig;
