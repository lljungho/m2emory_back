const express = require('express');
const router = express.Router();
const upload = require('../lib/utils/upload');
const uploadService = require('../lib/service/uploadService');
const utils = require('../lib/utils/utils');
const multer = require('multer');

// 프로필 이미지 수정    
router.put('/modifyProfileImg', upload.profileUpload.single('file'), (req, res) => {
    upload.profileUpload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // multer 오류
            return res.status(400).json({ 
                message: 'multer error', 
                error: err,
            });
        }
    });

    console.log('upload modifyProfileImg', req.file);
    uploadService.modifyProfileImg(req, res);
});

// 프로필 이미지 삭제
router.delete('/deleteProfileImg', (req, res) => {
    console.log('upload deleteProfileImg');
    uploadService.deleteProfileImg(req, res);
});

module.exports = router;