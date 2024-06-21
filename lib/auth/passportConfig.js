require('../../dotenvConfig');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const DB = require('../utils/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtConfig');

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

const cookieExtractor = (req, tokenType) => {
    return req?.cookies ? req.cookies[tokenType] : null;
};

// 공통 검증 함수
const JwtStrategyHandler = (tokenType, secret, userId) => new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([(req) => cookieExtractor(req, tokenType)]), secretOrKey: secret,
}, async (jwt_payload, done) => {
    try {
        console.log(`${tokenType} jwt_payload`, jwt_payload);
        const user_id = jwt_payload[userId];
        if (!user_id) {
            return done(null, false, { message: `${tokenType}: Invalid token` });
        };

        const sql = 'SELECT * FROM users WHERE user_id = ?';
        const [rows] = await DB.execute(sql, [user_id]);

        // DB 조회 결과 없음
        if (rows.length === 0) {
            console.log(`${tokenType} No user infomation`);
            return done(null, false, { message: `${tokenType}: No user infomation` });
        };

        console.log(`JwtStratege ${tokenType} valid seccess`);
        return done(null, rows[0]);

    } catch(error) {
        console.log(`${tokenType} =`, error);
        return done(null, false);
    }
});

passport.use('jwt', JwtStrategyHandler('accessToken', ACCESS_SECRET, 'user'));
passport.use('jwt-refresh', JwtStrategyHandler('refreshToken', REFRESH_SECRET, 'user_id'));
passport.use('jwt-account', JwtStrategyHandler('accountToken', ACCESS_SECRET, 'user'));

// JWT 인증 미들웨어
const authenticateJWT = (req, res, next) => { // access, refresh token
    const accessToken = cookieExtractor(req, 'accessToken');
    console.log('Extractor accessToken :', accessToken);
    
    passport.authenticate('jwt', { session: false }, async (err, user, info) => {
        if (err || !user) {
            console.log('Access token invalid or not present, trying refresh token');

            passport.authenticate('jwt-refresh', { session: false }, async (refreshErr, refreshUser, refreshInfo) => {
                if (refreshErr || !refreshUser) {
                    console.log('Refresh token invalid');
                    res.clearCookie('accessToken');
                    res.clearCookie('refreshToken');
                    return res.status(401).json({ 
                        tokenState: false, 
                        message: 'authenticateJWT() Unauthorized' 
                    });
                }

                console.log('JwtStrategy refreshToken valid success / new Token');
                let newAccessToken = generateAccessToken(refreshUser.user_id);
                let newRefreshToken = generateRefreshToken(refreshUser); // 액세스 토큰 새로 생성시 리프레시 토큰도 새로 생성(RTR)
                
                res.cookie('accessToken', newAccessToken);
                res.cookie('refreshToken', newRefreshToken);

                // 리프레시 토큰 DB업데이트
                let refreshSql = 'UPDATE token SET refresh_token = ? WHERE user_id = ?'; 
                await DB.execute(refreshSql, [newRefreshToken, refreshUser.user_id]);
                req.user = refreshUser;
                req.accessToken = newAccessToken;
                next();
            })(req, res, next);

        } else {
            console.log('Access token valid');
            console.log('User authenticated valid access token! userInfo:', user);
            req.user = user;
            req.accessToken = accessToken;
            next();
        }
    })(req, res, next);
};

const accountAuthJWT = (req, res, next) => { // account token
    const accountToken = cookieExtractor(req, 'accountToken');
    console.log('Extractor accountToken :', accountToken);

    passport.authenticate('jwt-account', { session: false }, async (err, user, info) => {
        if (err || !user) {
            console.log('Account token invalid');
            res.clearCookie('accountToken');
            return res.status(401).json({ 
                tokenState: true,
                message: 'accountAuthJWT() Unauthorized' 
            });

        } else {
            console.log('Account token valid');
            console.log('User authenticated valid account token! userInfo:', user);
            req.user = user;
            req.accountToken = accountToken;
            next();
        }
    })(req, res, next);
};

module.exports = { 
    passport, 
    authenticateJWT, 
    accountAuthJWT 
};
