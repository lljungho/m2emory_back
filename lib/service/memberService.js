const DB = require('../utils/database');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtConfig');
const utils = require('../utils/utils');

const memberService = {
    // 회원가입
    signUp: async (req, res) => { 
        try {
            let { id, pw, email } = req.body;
            console.log('signUp() data : ', req.body);
    
            const hashingPw = await utils.hashData(pw); // pw 해싱
    
            // 회원정보 저장
            let sql = "INSERT INTO Users(id, pw, email) VALUES(?, ?, ?)"; 

            await DB.execute(sql, [id, hashingPw, email]);

            console.log('User registered successfully');
            res.status(201).json({ 
                message: 'signUp() User registered successfully' 
            });

        } catch(error) {
            console.error(error);
            res.status(500).json({ 
                message: 'signUp() Internal server error' 
            });
        };   
    },

    // 로그인
    signIn: async (req, res) => {
        try {
            let { userId, userPassword } = req.body;
            console.log('signIn() data : ', req.body);
    
            // 회원정보 조회
            let sql = "SELECT * FROM Users WHERE id = ?";
            const [memRows] = await DB.execute(sql, [userId]);

            // DB조회결과 없음 로그인 실패
            if (memRows.length === 0) {
                return res.status(400).json({ 
                    message: 'signIn() Invalid id or password (id=null)' 
                });
            }

            const user = memRows[0];
            const isPasswordValid = await bcrypt.compare(userPassword, user.pw);

            // 비밀번호 오류
            if (!isPasswordValid) {
                return res.status(400).json({ 
                    message: 'signIn() Invalid id or password (!pw)' 
                });
            }

            // 액세스, 리프레시 토큰 생성
            let accessToken = generateAccessToken(user.id);
            let refreshToken = generateRefreshToken({
                id: user.id,
                email: user.email,
                pf_img: user.pf_img,
                pf_name: user.pf_name,
                pf_introduction: user.pf_introduction,
            });

            // 유저 정보 객체 생성
            const userInfo = utils.setUserInfo(user);

            let tokenSql = "SELECT * FROM Token WHERE id = ?";
            const [tokenRows] = await DB.execute(tokenSql, [user.id]);

            // 리프레시 토큰 저장 또는 업데이트 무조건 새토큰으로 저장
            if (tokenRows.length === 0) {
                let insertTokenSql = 'INSERT INTO Token(id, refresh_token) VALUES(?, ?)';
                await DB.execute(insertTokenSql, [user.id, refreshToken]);

            } else {
                let updateTokenSql = 'UPDATE Token SET refresh_token = ? WHERE id = ?';
                await DB.execute(updateTokenSql, [refreshToken, user.id]);
            }

            console.log('User signIn successfully');
            res.cookie('accessToken', accessToken);
            res.cookie('refreshToken', refreshToken);
            res.json({ 
                userInfo, 
                accessToken, 
                message: 'signIn() User signIn successfully' 
            });

        } catch(error) {
            console.log('signIn()', error);
            res.status(500).json({ 
                message: 'signIn() Internal server error' 
            });
        }
    },

    // 로그아웃
    signOut: (req, res) => {
        console.log('signOut()');
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.json({ 
            message: 'signOut() User signOut successfully' 
        });
    },

    // 유저 정보
    userInfo: (req, res) => { 
        const userInfo = utils.setUserInfo(req.user); // 유저 정보 객체 생성
        console.log('userInfo() accessToken : ', req.accessToken);

        res.json({ 
            userInfo, 
            accessToken: req.accessToken, 
            message: 'userInfo() userInfo successfully' 
        });
    },

    // 프로필 내용 수정
    modifyProfile: async (req, res) => { // 프로필 내용 수정
        try {
            let { name, introduction } = req.body;
            console.log('modifyProfile() data : ', req.body);

            // passport 검증 완료된 유저 정보
            const u_id = req.user.id;
    
            // 회원정보 저장
            let sql = "UPDATE Users SET pf_name = ?, pf_introduction = ? WHERE id = ?"; 
            await DB.execute(sql, [name, introduction, u_id]);

            console.log('modifyProfile successfully');
            res.status(201).json({ 
                name,
                introduction,
                message: 'modifyProfile() modifyProfile successfully'
            });
    
        } catch(error) {
            console.log('modifyProfile()', error);
            return res.status(500).json({ 
                message: 'modifyProfile() Error modifyProfile' 
            });
        };   
    },

    // 더미계정생성 (삭제)
    dummyUsers: async (req, res) => {
        try {
            for (let i=0; i < 100; i++ ) {
                let id = `test111${i}`;
                let pw = '$2b$10$nX0kABqkaHlYsa.M7bEPquFsX5GVcYLflhSUV2RG9x4bsz2IZEdq6';
                let email = `test${i}@test.test`;
                let pf_name = `${id}-${i}`;
                let pf_introduction = `${id}\n${email}\n\n${id}\n${pf_name}`;

                let sql = `INSERT INTO Users(id, pw, email, pf_name, pf_introduction) VALUES(?,?,?,?,?)`;

                await DB.execute(sql, [id, pw, email, pf_name, pf_introduction]);
                console.log(`계정 ${id} 추가`);
            }
            console.log('더미 계정 추가 완료');

        } catch(error) {
            console.log(err);
        }
    },
};

module.exports = memberService;