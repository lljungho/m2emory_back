require('../../dotenvConfig');
const multer = require('multer');
const uuid4 = require("uuid4");
const fs = require('fs');
const path = require('path');
const utils = require('./utils');

const profileImgDir = process.env.MEMBER_UPLOAD_PROFILE_IMG_DIR;

const upload = {
    profileUpload: multer({
        storage: multer.diskStorage({
            destination(req, file, cd) {
                let fileDir = profileImgDir + `${req.user.user_id}/`;

                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true });
                }
                cd(null, fileDir);
            },
            
            filename(req, file, cd) {
                const name = uuid4();
                const ext = path.extname(file.originalname);
                const filename = name + ext;

                console.log('name----', name);
                console.log('ext----', ext);
                console.log('filename----', filename);

                cd(null, filename);
            },
        }),
        limits: {fileSize: 1024 * 1024 * 5},
    }),
};

module.exports = upload;