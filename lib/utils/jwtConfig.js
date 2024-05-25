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
            id: user.id,
            email: user.email,
            pf_img: user.pf_img,
            pf_name: user.pf_name,
            pf_introduction: user.pf_introduction,
        },
        REFRESH_SECRET,
        { expiresIn: '7d', issuer : 'About Tech' }
    )
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
};