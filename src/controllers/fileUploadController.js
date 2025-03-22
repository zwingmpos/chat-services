const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Chat = require('../models/Chat');
const ChatRoom = require('../models/ChatRoom');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true});
}

// Helper function to format file size
const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

// Multer upload configuration (only handles specific file types)
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('❌ Invalid file type. Allowed types: PNG, JPEG, PDF, TXT'), false);
    },
}).single('attachment');

// Upload and save attachment
const uploadFile = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('❌ File upload error:', err);
            return res.status(200).json({status: 'error', message: 'File upload failed'});
        }

        if (!req.file) {
            return res.status(200).json({status: 'fail', message: 'No file uploaded'});
        }

        try {
            const file = req.file;

            // Prepare attachment object
            const attachment = {
                url: `/uploads/${file.filename}`,
                size: formatFileSize(file.size),
                name: file.originalname,
                type: file.mimetype,
                uploadedAt: new Date(),
            };

            return res.status(200).json({
                status: 'success',
                message: 'File uploaded successfully',
                attachment,
            });
        } catch (error) {
            console.error('❌ Error processing file:', error);
            return res.status(500).json({status: 'error', message: 'Server error'});
        }
    });
};

module.exports = {uploadFile};