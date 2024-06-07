const DB = require('../utils/database');

const uploadService = {
    // 프로필 이미지 업로드
    modifyProfileImg: async (req, res) => { 
        try {
            console.log('data : ', req.file, req.user.user_id);
    
            // 회원정보 저장
            let sql = "UPDATE users SET user_pf_img = ? WHERE user_id = ?"; 
            await DB.execute(sql, [req.file.filename, req.user.user_id]);

            console.log('member modifyProfile success');
            res.status(201).json({ 
                user_pf_img: req.file.filename, 
                message: 'modifyProfileImg() success' 
            }); 

        } catch(error) {
            console.error('=====>',error);
            return res.status(500).json({ 
                message: 'Error modifyProfile' 
            });
        };   
    },

    // 프로필 이미지 삭제
    deleteProfileImg: async (req, res) => {
        try {
            console.log('upload deleteProfileImg()');

            // 회원 프로필 이미지 정보 삭제
            let sql = "UPDATE users SET user_pf_img = '' WHERE user_id = ?";
            await DB.execute(sql, [req.user.user_id]);

            console.log('member deleteProfileImg success');
            res.status(201).json({ 
                message: 'deleteProfileImg() success' 
            }); 

        } catch(error) {
            console.error('=====>',error);
            return res.status(500).json({ 
                message: 'Error deleteProfileImg'
            });
        }
    },
};

module.exports = uploadService;