const DB = require('../utils/database');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtConfig');
const utils = require('../utils/utils');
const { handleServerError, handleDatabaseError } = require('../utils/error');

const memberService = {
    // 회원가입
    signUp: async (req, res) => { 
        try {
            let { id, pw, tel, email } = req.body;
            console.log('signUp() data : ', req.body);
    
            const hashingPw = await utils.hashData(pw); // pw 해싱
    
            // 회원정보 저장
            let sql = "INSERT INTO users(user_id, user_pw, user_tel, user_email) VALUES(?, ?, ?, ?)"; 

            await DB.execute(sql, [id, hashingPw, tel, email]);

            console.log('User registered successfully');
            res.status(201).json({ 
                message: 'signUp() User registered successfully' 
            });

        } catch(error) {
            handleServerError(res, error, 'signUp()');
        };   
    },

    // 로그인
    signIn: async (req, res) => {
        try {
            let { userId, userPassword } = req.body;
            console.log('signIn() data : ', req.body);
    
            // 회원정보 조회
            let sql = "SELECT * FROM users WHERE user_id = ?";
            const [memRows] = await DB.execute(sql, [userId]);

            // DB조회결과 없음 로그인 실패
            if (memRows.length === 0) {
                return handleDatabaseError(res, 'signIn()');
            }

            const user = memRows[0];
            const isPasswordValid = await bcrypt.compare(userPassword, user.user_pw);

            // 비밀번호 오류
            if (!isPasswordValid) {
                return handleDatabaseError(res, 'signIn()');
            }

            // 액세스, 리프레시 토큰 생성
            let accessToken = generateAccessToken(user.user_id);
            let refreshToken = generateRefreshToken(user);

            // 유저 정보 객체 생성
            const userInfo = utils.setUserInfo(user);

            let tokenSql = "SELECT * FROM token WHERE user_id = ?";
            const [tokenRows] = await DB.execute(tokenSql, [user.user_id]);

            // 리프레시 토큰 저장 또는 업데이트 무조건 새토큰으로 저장
            if (tokenRows.length === 0) {
                let insertTokenSql = 'INSERT INTO token(user_id, refresh_token) VALUES(?, ?)';
                await DB.execute(insertTokenSql, [user.user_id, refreshToken]);

            } else {
                let updateTokenSql = 'UPDATE token SET refresh_token = ? WHERE user_id = ?';
                await DB.execute(updateTokenSql, [refreshToken, user.user_id]);
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
            handleServerError(res, error, 'signIn()');
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

    // 아이디 찾기
    forgotId: async (req, res) => {
        try {
            let { email, tel } = req.body;
            console.log('forgotId() data : ', req.body);

            // 회원정보 조회
            let sql = "SELECT user_id, reg_date FROM users WHERE user_email = ? AND user_tel = ?";
            const [memRows] = await DB.execute(sql, [email, tel]);

            // DB조회결과 없음 회원 조회 실패
            if (memRows.length === 0) {
                return handleDatabaseError(res, 'forgotId()');
            }

            const user = memRows;
            console.log('forgotId() :', memRows);

            res.json({
                user,
                message: 'forgotId() successfully' 
            });

        } catch(error) {
            handleServerError(res, error, 'forgotId()');
        }
    },

    // 유저 정보
    userInfo: (req, res) => { 
        const userInfo = utils.setUserInfo(req.user); // 유저 정보 객체 생성
        console.log('userInfo() : ', userInfo);

        res.json({ 
            userInfo, 
            message: 'userInfo() userInfo successfully' 
        });
    },

    // 프로필 내용 수정
    modifyProfile: async (req, res) => { // 프로필 내용 수정
        try {
            let { name, introduction } = req.body;
            console.log('modifyProfile() data : ', req.body);

            // passport 검증 완료된 유저 정보
            const user_id = req.user.user_id;
    
            // 회원정보 저장
            let sql = "UPDATE users SET user_pf_name = ?, user_pf_introduction = ? WHERE user_id = ?"; 
            await DB.execute(sql, [name, introduction, user_id]);

            console.log('modifyProfile successfully');
            res.status(201).json({ 
                name,
                introduction,
                message: 'modifyProfile() modifyProfile successfully'
            });
    
        } catch(error) {
            handleServerError(res, error, 'modifyProfile()');
        };   
    },

    // 더미계정생성 (삭제)
    dummyUsers: async (req, res) => {
        try {
            for (let i=0; i < 100; i++ ) {
                let id = `test11${i}`;
                let pw = '$2b$10$nX0kABqkaHlYsa.M7bEPquFsX5GVcYLflhSUV2RG9x4bsz2IZEdq6';
                let email = `test${i}@test.test`;
                let tel = '010-1234-1234';
                let pf_name = `${id}-${i}`;
                let pf_introduction = `${id}\n${email}\n\n${id}\n${pf_name}`;

                let sql = `INSERT INTO users(user_id, user_pw, user_email, user_tel, user_pf_name, user_pf_introduction) VALUES(?,?,?,?,?)`;

                await DB.execute(sql, [id, pw, email, tel, pf_name, pf_introduction]);
                console.log(`계정 ${id} 추가`);
            }
            console.log('더미 계정 추가 완료');

        } catch(error) {
            console.log(error);
        }
    },
};

module.exports = memberService;