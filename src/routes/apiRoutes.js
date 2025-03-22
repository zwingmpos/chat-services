const express = require('express');
const {authenticateToken} = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');
const authController = require('../controllers/authController');
const fileUploadController = require('../controllers/fileUploadController');


const router = express.Router();

router.get('/history', chatController.getChatHistory);
router.post('/store-offline-message', chatController.storeOfflineMessage);
router.post('/login', authController.loginUser);
router.get('/user-list', authController.getUserList);
router.post('/upload-file', fileUploadController.uploadFile);

module.exports = router;