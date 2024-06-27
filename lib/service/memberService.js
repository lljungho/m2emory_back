const DB = require('../utils/database');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken, generateAccountToken } = require('../utils/jwtConfig');
const utils = require('../utils/utils');
const { handleServerError, handleDatabaseError } = require('../utils/error');
const { transporter } = require('../utils/mail');

const memberService = {
    // 회원가입
    signUp: async (req, res) => { 
        try {
            let { id, pw, tel, email } = req.body;
            console.log('signUp() data : ', req.body);
    
            const hashingPw = await utils.hashData(pw); // pw 해싱
            console.log('hasingData :', hashingPw);
    
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

    // 비밀번호 찾기
    forgotPw: async (req, res) => {
        try {
            let { userId, email, tel } = req.body;
            console.log('forgotPw() data : ', req.body);

            // 회원정보 조회
            let sql = "SELECT user_email FROM users WHERE user_id = ? AND user_email = ? AND user_tel = ?";
            const [memRows] = await DB.execute(sql, [userId, email, tel]);

            // DB조회결과 없음 회원 조회 실패
            if (memRows.length === 0) {
                return handleDatabaseError(res, 'forgotPw()');
            }

            const user = memRows[0];
            console.log('forgotPw() :', user.user_email);

            // 임시 비밀번호 생성
            const temporaryPassword = utils.randomGenerate(8); 

            // 이메일 내용
            const mailOptions = {
                from: process.env.EMAIL_ADDRESS,
                to: user.user_email,
                subject: '[MosaicMemory] 임시 비밀번호 안내',
                html: `임시 비밀번호는 <strong>${temporaryPassword}</strong> 입니다. 로그인 후 비밀번호를 변경해주세요.`
            };

            // 이메일 전송
            await transporter.sendMail(mailOptions);
            console.log('forgotPw() mail send success:', mailOptions);

            // 데이터 베이스 임시 비밀번호 업데이트
            const hashingPw = await utils.hashData(temporaryPassword); // pw 해싱
            let updateSql = "UPDATE users SET user_pw = ? WHERE user_id = ?";
            await DB.execute(updateSql, [hashingPw, userId]);

            res.json({
                user,
                message: 'forgotPw() successfully' 
            });

        } catch(error) {
            handleServerError(res, error, 'forgotPw()');
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

    // 비밀번호로 로그인 회원 확인
    passwordCheck: async (req, res) => { 
        try {
            const user_id = req.user.user_id;
            let { userPassword } = req.body;
            console.log('passwordCheck() data : ', req.body);
    
            // 회원정보 조회
            let sql = "SELECT * FROM users WHERE user_id = ?";
            const [memRows] = await DB.execute(sql, [user_id]);

            // DB조회결과 없음 요청 실패
            if (memRows.length === 0) {
                return handleDatabaseError(res, 'passwordCheck()');
            }

            const user = memRows[0];
            const isPasswordValid = await bcrypt.compare(userPassword, user.user_pw);

            // 비밀번호 오류
            if (!isPasswordValid) {
                return handleDatabaseError(res, 'passwordCheck()');
            }

            console.log('User passwordCheck successfully');
            let accountToken = generateAccountToken(user.user_id);
            res.cookie('accountToken', accountToken);
            res.json({ 
                accountToken,
                message: 'passwordCheck() User passwordCheck successfully' 
            });

        } catch(error) {
            handleServerError(res, error, 'passwordCheck()');
        }
    },

    // 회원 확인되었는지 accountToken으로 확인
    accountCheck: (req, res) => { 
        const accountToken = req.accountToken;
        console.log('accountCheck() token :', accountToken);
        res.json({
            accountToken,
            message: 'accountCheck() accountToken successfully'
        });
    },

    // 프로필 내용 수정
    modifyProfile: async (req, res) => { 
        try {
            let { name, introduction } = req.body;
            console.log('modifyProfile() data : ', req.body);

            // passport-JWT 검증 완료된 유저 정보
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

    // 계정 정보 수정
    modifyAccount: async (req, res) => {
        try {
            let { pw, email, tel } = req.body;
            console.log('modifyAccount() data : ', req.body);

            // passport-JWT 검증 완료된 유저 정보
            const user_id = req.user.user_id;
            const hashingPw = await utils.hashData(pw); // pw 해싱
            console.log('hasingData :', hashingPw);
    
            // 회원정보 저장
            let sql = "UPDATE users SET user_pw = ?, user_email = ?, user_tel = ? WHERE user_id = ?"; 
            await DB.execute(sql, [hashingPw, email, tel, user_id]);

            console.log('modifyAccount successfully');
            res.status(201).json({ 
                message: 'modifyAccount() modifyAccount successfully'
            });
    
        } catch(error) {
            handleServerError(res, error, 'modifyAccount()');
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