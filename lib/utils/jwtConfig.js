require('../../dotenvConfig');
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_SECRET; 
const REFRESH_SECRET = process.env.REFRESH_SECRET; 

// 액세스 토큰 생성
const generateAccessToken = (user) => {
    console.log('generateAccessToken()', user);
    return jwt.sign(
        { user: user }, // 유저 ID
        ACCESS_SECRET,
        { expiresIn: '30m', issuer : 'About Tech' }
    )
};

// 리프레시 토큰 생성
const generateRefreshToken = (user) => {
    console.log('generateRefreshToken()', user);
    return jwt.sign(
        {
            user_id: user.user_id,
            user_email: user.user_email,
            user_pf_img: user.user_pf_img,
            user_pf_name: user.user_pf_name,
            user_pf_introduction: user.user_pf_introduction,
        },
        REFRESH_SECRET,
        { expiresIn: '7d', issuer : 'About Tech' }
    )
};

// 로그인 회원 확인 토큰 생성
const generateAccountToken = (user) => {
    console.log('generateAccountToken()', user);
    return jwt.sign(
        { 
            sort: 'Account Check',
            user: user 
        },
        ACCESS_SECRET,
        { expiresIn: '10m', issuer : 'About Tech' }
    )
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateAccountToken,
};