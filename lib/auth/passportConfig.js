require('../../dotenvConfig');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const DB = require('../utils/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtConfig');

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

const cookieExtractor = (tokenType) => {
    return (req) => {
        let token = null;
        if (req && req.cookies) {
            token = req.cookies[tokenType]; // 쿠키에서 해당 타입 토큰 추출
        }

        console.log(`Extractor ${tokenType}`, token);
        return token;
    };
};

const accessTokenCookieExtractor = cookieExtractor('accessToken');
const refreshTokenCookieExtractor = cookieExtractor('refreshToken');

// 액세스 토큰 검증
passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([accessTokenCookieExtractor]),
    secretOrKey: ACCESS_SECRET,
}, async (jwt_payload, done) => {
    try {
        console.log('jwt jwt_payload', jwt_payload);
        if (!jwt_payload || !jwt_payload.user) {
            return done(null, false, { message: 'jwt: Invalid accessToken' });
        }
        
        let u_id = jwt_payload.user;
        let sql = 'SELECT * FROM Users WHERE id = ?';
        const [rows] = await DB.execute(sql, [u_id]);

        // DB조회결과 없음 인증 실패
        if (rows.length === 0) {
            console.log('No user information');
            return done(null, false, { message: 'jwt: No user information'});
        }

        console.log('JwtStrategy accessToken valid success');
        const accessToken = accessTokenCookieExtractor(req);
        return done(null, rows[0], { accessToken });

    } catch(error) {
        console.error(error);
        return done(error, false);
    }
}));

// 리프레시 토큰 검증
passport.use('jwt-refresh', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([refreshTokenCookieExtractor]),
    secretOrKey: REFRESH_SECRET,
}, async (jwt_payload, done) => {
    try {
        console.log('jwt-refresh jwt_payload', jwt_payload);
        if (!jwt_payload || !jwt_payload.id) {
            return done(null, false, { message: 'jwt-refresh: Invalid refreshToken' });
        }
        
        let u_id = jwt_payload.id;
        let sql = 'SELECT * FROM Users WHERE id = ?';
        const [rows] = await DB.execute(sql, [u_id]);

        // DB조회결과 없음 인증 실패
        if (rows.length === 0) {
            console.log('No user information');
            return done(null, false, { message: 'jwt-refresh: No user information'});
        }
        
        console.log('JwtStrategy jwt-refresh valid');
        return done(null, rows[0]);

    } catch(error) {
        console.error(error);
        return done(error, false);
    }
}));

// JWT 인증 미들웨어
const authenticateJWT = (req, res, next) => {
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
                let newAccessToken = generateAccessToken(refreshUser.id);
                let newRefreshToken = generateRefreshToken(refreshUser); // 액세스 토큰 새로 생성시 리프레시 토큰도 새로 생성(RTR)
                
                res.cookie('accessToken', newAccessToken);
                res.cookie('refreshToken', newRefreshToken);

                // 리프레시 토큰 DB업데이트
                let refreshSql = 'UPDATE Token SET refresh_token = ? WHERE id = ?'; 
                await DB.execute(refreshSql, [newRefreshToken, refreshUser.id]);
                req.user = refreshUser;
                req.accessToken = newAccessToken;
                next();
            })(req, res, next);

        } else {
            console.log('Access token valid');
            console.log('User authenticated via access token:', user);
            req.user = user;
            req.accessToken = info.accessToken;
            next();
        }
    })(req, res, next);
};

module.exports = { passport, authenticateJWT };