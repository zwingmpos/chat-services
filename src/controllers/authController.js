const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const loginUser = async (req, res) => {
    try {
        const {mobile_number} = req.body;

        if (!mobile_number) {
            return res.status(200).json({status: 'fail', message: 'Mobile number is required'});
        }

        // 🔍 Check if user exists in MongoDB
        const user = await User.findOne({mobile_number});

        if (!user) {
            return res.status(200).json({status: 'fail', message: 'User not registered'});
        }

        const token = jwt.sign(
            {userId: user._id, mobile_number: user.mobile_number},
            process.env.JWT_SECRET,
            {expiresIn: '1d'}
        );

        // 🔹 Response with token
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                mobile_number: user.mobile_number,
                email: user.email,
            },
            token
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({status: 'server_error', message: 'Internal Server Error'});
    }
};

const getUserList = async (req, res) => {
    try {
        const {user_id} = req.query;

        if (!user_id) {
            return res.status(200).json({status: 'fail', message: 'User ID is required'});
        }

        // Fetch all users except the one with the given user_id
        const users = await User.find({_id: {$ne: user_id}}).select('-__v -createdAt');

        return res.status(200).json({status: 'success', users});
    } catch (error) {
        console.error('Error fetching user list:', error);
        return res.status(500).json({status: 'error', message: 'Server Error'});
    }
};

module.exports = {loginUser, getUserList};