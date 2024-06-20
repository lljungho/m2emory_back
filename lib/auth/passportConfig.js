require('../../dotenvConfig');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const DB = require('../utils/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtConfig');

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

const cookieExtractor = (req, tokenType) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies[tokenType]; // 쿠키에서 해당 타입 토큰 추출
    }
    return token;
};

// 액세스 토큰 검증
passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([(req) => cookieExtractor(req, 'accessToken')]),
    secretOrKey: ACCESS_SECRET,
}, async (jwt_payload, done) => {
    try {
        console.log('jwt jwt_payload', jwt_payload);
        if (!jwt_payload || !jwt_payload.user) {
            return done(null, false, { message: 'jwt: Invalid accessToken' });
        }
        
        let user_id = jwt_payload.user;
        let sql = 'SELECT * FROM users WHERE user_id = ?';
        const [rows] = await DB.execute(sql, [user_id]);

        // DB조회결과 없음 인증 실패
        if (rows.length === 0) {
            console.log('No user information');
            return done(null, false, { message: 'jwt: No user information'});
        }

        console.log('JwtStrategy accessToken valid success');
        return done(null, rows[0]);

    } catch(error) {
        console.error(error);
        return done(error, false);
    }
}));

// 리프레시 토큰 검증
passport.use('jwt-refresh', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([(req) => cookieExtractor(req, 'refreshToken')]),
    secretOrKey: REFRESH_SECRET,
}, async (jwt_payload, done) => {
    try {
        console.log('jwt-refresh jwt_payload', jwt_payload);
        if (!jwt_payload || !jwt_payload.user_id) {
            return done(null, false, { message: 'jwt-refresh: Invalid refreshToken' });
        }
        
        let user_id = jwt_payload.user_id;
        let sql = 'SELECT * FROM users WHERE user_id = ?';
        const [rows] = await DB.execute(sql, [user_id]);

        // DB조회결과 없음 인증 실패
        if (rows.length === 0) {
            console.log('No user information');
            return done(null, false, { message: 'jwt-refresh: No user information'});
        }
        
        console.log('JwtStrategy refreshToken valid');
        return done(null, rows[0]);

    } catch(error) {
        console.error(error);
        return done(error, false);
    }
}));

// accountToken 검증
passport.use('jwt-account', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([(req) => cookieExtractor(req, 'accountToken')]),
    secretOrKey: ACCESS_SECRET,
}, async (jwt_payload, done) => {
    try {
        console.log('jwt-account jwt_payload', jwt_payload);
        if (!jwt_payload || !jwt_payload.user) {
            return done(null, false, { message: 'jwt-account: Invalid accountToken' });
        }
        
        let user_id = jwt_payload.user;
        let sql = 'SELECT * FROM users WHERE user_id = ?';
        const [rows] = await DB.execute(sql, [user_id]);

        // DB조회결과 없음 인증 실패
        if (rows.length === 0) {
            console.log('No user information');
            return done(null, false, { message: 'jwt-account: No user information'});
        }

        console.log('JwtStrategy accountToken valid success');
        return done(null, rows[0]);

    } catch(error) {
        console.error(error);
        return done(error, false);
    }
}));

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
                tokenState: false, 
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
